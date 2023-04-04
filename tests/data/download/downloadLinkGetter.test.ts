import fetch from 'node-fetch';
import getDownloadLink from '../../../src/data/download/downloadLinkGetter';

jest.mock('node-fetch', () => jest.fn());

describe('getDownloadLink', () => {
  it('returns the download link', async () => {
    const mockResponse = {
      text: () => Promise.resolve('<a id="download_button" href="/download">Download</a>'),
    };
    (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    const url = 'https://example.com';
    const result = await getDownloadLink(url);

    expect(result).toBe('https://app.thedigitalbiblelibrary.org/download');
    expect(fetch).toHaveBeenCalledWith(url);
  });

  it('throws an error if fetch fails', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Fetch failed'));

    const url = 'https://example.com';
    await expect(getDownloadLink(url)).rejects.toThrow(
      'getDownloadLink failed: Fetch failed',
    );
  });
});