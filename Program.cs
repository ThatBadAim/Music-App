using System.Diagnostics;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using MusicApp.Data;
using MusicApp.Models;

var builder = WebApplication.CreateBuilder(args);

// Ensure the server listens on port 5000
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenLocalhost(5000);
});

// Add services to the container.
builder.Services.AddControllers();

// Configure EF Core with SQLite
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=app.db"));

// Configure Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// Configure Authentication and JWT
var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key is not configured.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "MusicApp";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "MusicApp";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

var app = builder.Build();

// Support standard client root routing and static media streams
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

// Map controllers for API endpoints
app.MapControllers();

// Fallback routing for SPA React Router
app.MapFallbackToFile("index.html");

// Auto-open browser when .NET server successfully boots
app.Lifetime.ApplicationStarted.Register(() =>
{
    var url = "http://localhost:5000";
    Console.WriteLine("\n========================================================");
    Console.WriteLine($"[Human Music Host] Server is active at: {url}");
    Console.WriteLine("[Human Music Host] Dispatching auditory interface browser window...");
    Console.WriteLine("========================================================\n");

    try
    {
        Console.WriteLine("[Human Music Host] Launching standalone desktop app frame (msedge app-mode)...");
        Process.Start(new ProcessStartInfo
        {
            FileName = "msedge.exe",
            Arguments = $"--app={url}",
            UseShellExecute = true
        });
    }
    catch
    {
        try
        {
            // Fallback to default browser
            Process.Start(new ProcessStartInfo
            {
                FileName = url,
                UseShellExecute = true
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Human Music Host] Note: Automatic launch failed. Please open {url} manually.");
            Console.WriteLine($"Details: {ex.Message}");
        }
    }
});

app.Run();
