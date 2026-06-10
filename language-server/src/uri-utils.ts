// URI 정규화 유틸.
//
// 같은 파일이라도 LSP 클라이언트와 Node가 만드는 file URI 형식이 다르다.
// VSCode는 경로의 '@' 등 RFC 3986 unreserved 밖 문자를 percent-encode하고
// (file:///Users/x/%40src/...), Node의 pathToFileURL은 그대로 둔다
// (file:///Users/x/@src/...). Windows에서는 드라이브 문자 표기도 갈린다
// (file:///c%3A/ vs file:///C:/). 문자열 키로 문서를 관리하는 이상 한 가지
// 표준형으로 통일하지 않으면 같은 파일이 이중 등록된다.

import { fileURLToPath, pathToFileURL } from 'url';

const WINDOWS_DRIVE = /^file:\/\/\/([A-Z])(:|%3[Aa])(\/|$)/;

export function normalizeUri(uri: string): string {
  if (!uri.startsWith('file:')) {
    return uri;
  }

  let normalized = uri;
  try {
    // 경로로 변환했다가 되돌리면 percent-encoding이 Node 표준형으로 통일된다
    normalized = pathToFileURL(fileURLToPath(uri)).toString();
  } catch {
    return uri;
  }

  return normalized.replace(
    WINDOWS_DRIVE,
    (_, drive: string, colon: string, tail: string) =>
      `file:///${drive.toLowerCase()}${colon}${tail}`,
  );
}
