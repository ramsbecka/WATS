/**
 * Shim for "charenc" (0.0.2) used by md5 -> Expo CLI. Ensures require('charenc') works on Windows.
 */
var charenc = {
  utf8: {
    stringToBytes: function (str) {
      return charenc.bin.stringToBytes(unescape(encodeURIComponent(str)));
    },
    bytesToString: function (bytes) {
      return decodeURIComponent(escape(charenc.bin.bytesToString(bytes)));
    },
  },
  bin: {
    stringToBytes: function (str) {
      for (var bytes = [], i = 0; i < str.length; i++)
        bytes.push(str.charCodeAt(i) & 0xff);
      return bytes;
    },
    bytesToString: function (bytes) {
      for (var str = [], i = 0; i < bytes.length; i++)
        str.push(String.fromCharCode(bytes[i]));
      return str.join('');
    },
  },
};
module.exports = charenc;
