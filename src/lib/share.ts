import LZString from 'lz-string';

export const encodeData = (data: any): string => {
    return LZString.compressToEncodedURIComponent(JSON.stringify(data));
};

export const decodeData = (encoded: string): any => {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    return json ? JSON.parse(json) : null;
};
