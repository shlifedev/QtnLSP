using System;
using System.Collections.Generic;
using System.ComponentModel.Composition;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.VisualStudio.LanguageServer.Client;
using Microsoft.VisualStudio.Threading;
using Microsoft.VisualStudio.Utilities;
using Newtonsoft.Json.Linq;

namespace QtnLanguageExtension
{
    [ContentType("qtn")]
    [Export(typeof(ILanguageClient))]
    public class QtnLanguageClient : ILanguageClient
    {
        public string Name => "QTN Language Server";

        public IEnumerable<string>? ConfigurationSections => null;

        public object? InitializationOptions => new JObject(
            new JProperty("locale", System.Globalization.CultureInfo.CurrentUICulture.Name)
        );

        public IEnumerable<string> FilesToWatch => new[] { "**/*.qtn" };

        public bool ShowNotificationOnInitializeFailed => true;

        public event AsyncEventHandler<EventArgs>? StartAsync;
        public event AsyncEventHandler<EventArgs>? StopAsync;

        public async Task<Connection?> ActivateAsync(CancellationToken token)
        {
            await Task.Yield();

            var nodePath = FindNodePath();
            if (nodePath == null)
            {
                throw new InvalidOperationException(
                    "Node.js not found. Please install Node.js 18+ and ensure it is available in PATH. " +
                    "Download from https://nodejs.org/");
            }

            var extensionDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
            var serverPath = Path.Combine(extensionDir!, "LanguageServer", "server.js");

            if (!File.Exists(serverPath))
            {
                throw new FileNotFoundException(
                    $"QTN Language Server not found at: {serverPath}. " +
                    "Please rebuild the extension with 'build.sh vs'.");
            }

            var processStartInfo = new ProcessStartInfo
            {
                FileName = nodePath,
                Arguments = $"\"{serverPath}\" --stdio",
                RedirectStandardInput = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            var process = new Process { StartInfo = processStartInfo };
            if (!process.Start())
            {
                throw new InvalidOperationException("Failed to start QTN Language Server process.");
            }

            return new Connection(
                process.StandardOutput.BaseStream,
                process.StandardInput.BaseStream);
        }

        public async Task OnLoadedAsync()
        {
            if (StartAsync != null)
            {
                await StartAsync.InvokeAsync(this, EventArgs.Empty);
            }
        }

        public Task OnServerInitializedAsync()
        {
            return Task.CompletedTask;
        }

        public Task<InitializationFailureContext?> OnServerInitializeFailedAsync(
            ILanguageClientInitializationInfo initializationState)
        {
            var failureContext = new InitializationFailureContext
            {
                FailureMessage = $"QTN Language Server initialization failed: {initializationState.StatusMessage}"
            };
            return Task.FromResult<InitializationFailureContext?>(failureContext);
        }

        private static string? FindNodePath()
        {
            // Try 'node' directly from PATH
            try
            {
                var testProcess = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "node",
                        Arguments = "--version",
                        RedirectStandardOutput = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    }
                };
                if (testProcess.Start())
                {
                    testProcess.WaitForExit(5000);
                    if (testProcess.ExitCode == 0)
                    {
                        return "node";
                    }
                }
            }
            catch
            {
                // node not in PATH, try common locations
            }

            // Common Node.js installation paths on Windows
            var commonPaths = new[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "nodejs", "node.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "nodejs", "node.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "nodejs", "node.exe"),
            };

            foreach (var path in commonPaths)
            {
                if (File.Exists(path))
                {
                    return path;
                }
            }

            // Check NVM for Windows
            var nvmHome = Environment.GetEnvironmentVariable("NVM_HOME");
            if (!string.IsNullOrEmpty(nvmHome))
            {
                var nvmSymlink = Environment.GetEnvironmentVariable("NVM_SYMLINK");
                if (!string.IsNullOrEmpty(nvmSymlink))
                {
                    var nvmNodePath = Path.Combine(nvmSymlink, "node.exe");
                    if (File.Exists(nvmNodePath))
                    {
                        return nvmNodePath;
                    }
                }
            }

            return null;
        }
    }
}
