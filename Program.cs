using System.Diagnostics;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

// Ensure the server listens on port 5000
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenLocalhost(5000);
});

var app = builder.Build();

// Support standard client root routing and static media streams
app.UseDefaultFiles();
app.UseStaticFiles();

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
