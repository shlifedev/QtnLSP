using System.ComponentModel.Composition;
using Microsoft.VisualStudio.LanguageServer.Client;
using Microsoft.VisualStudio.Utilities;

namespace QtnLanguageExtension
{
    public static class QtnContentTypeDefinition
    {
        [Export]
        [Name("qtn")]
        [BaseDefinition(CodeRemoteContentDefinition.CodeRemoteContentTypeName)]
        internal static ContentTypeDefinition QtnContentType = null!;

        [Export]
        [FileExtension(".qtn")]
        [ContentType("qtn")]
        internal static FileExtensionToContentTypeDefinition QtnFileExtension = null!;
    }
}
