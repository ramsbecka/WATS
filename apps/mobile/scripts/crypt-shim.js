/**
 * Shim for the deprecated "crypt" npm package (0.0.2) used by "md5" -> @expo/rudder-sdk-node.
 * The real "crypt" package uses Node's legacy bindings that are not available on Windows.
 * This pure-JS shim provides the same API so Expo CLI can start on Windows.
 * API used by md5: bytesToWords, endian, wordsToBytes, bytesToHex.
 */

function bytesToWords(bytes) {
  var words = [];
  for (var i = 0; i < bytes.length; i += 4) {
    words.push(
      (bytes[i] & 0xff) |
      ((bytes[i + 1] & 0xff) << 8) |
      ((bytes[i + 2] & 0xff) << 16) |
      ((bytes[i + 3] & 0xff) << 24)
    );
  }
  return words;
}

function endian(words) {
  for (var i = 0; i < words.length; i++) {
    var w = words[i];
    words[i] =
      ((w << 8) & 0xff00ff00) |
      ((w >>> 8) & 0x00ff00ff);
  }
  return words;
}

function wordsToBytes(words) {
  var bytes = [];
  for (var i = 0; i < words.length; i++) {
    var w = words[i];
    bytes.push(w & 0xff, (w >>> 8) & 0xff, (w >>> 16) & 0xff, (w >>> 24) & 0xff);
  }
  return bytes;
}

function bytesToHex(bytes) {
  var hex = '';
  for (var i = 0; i < bytes.length; i++) {
    var h = (bytes[i] & 0xff).toString(16);
    hex += h.length === 1 ? '0' + h : h;
  }
  return hex;
}

module.exports = {
  bytesToWords: bytesToWords,
  endian: endian,
  wordsToBytes: wordsToBytes,
  bytesToHex: bytesToHex,
};
