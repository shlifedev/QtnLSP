import * as path from 'path';
import { workspace, ExtensionContext, env } from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient | undefined;

export function activate(context: ExtensionContext) {
  // Path to the language server module (bundled)
  const serverModule = path.join(
    context.extensionPath,
    'dist',
    'server.js'
  );

  // Server options: use stdio transport
  const serverOptions: ServerOptions = {
    module: serverModule,
    transport: TransportKind.stdio
  };

  // Client options: document selector and file watcher
  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'qtn' }],
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher('**/*.qtn')
    },
    initializationOptions: {
      locale: env.language  // e.g. 'ko', 'en', 'ja'
    }
  };

  // Create and start the language client
  client = new LanguageClient(
    'qtnLanguageServer',
    'QTN Language Server',
    serverOptions,
    clientOptions
  );

  client.start();
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
