import { archiveUrl, checkArchived, getLatestArchive } from '../src/archive';
import { isValidUrl, normalizeUrl } from '../src/utils';

describe('archive-url library', () => {
  describe('URL validation', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://example.com/path')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not a url')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('URL normalization', () => {
    it('should normalize URLs correctly', () => {
      expect(normalizeUrl('https://example.com#fragment')).toBe(
        'https://example.com/'
      );
      expect(normalizeUrl('https://example.com/')).toBe('https://example.com/');
    });
  });

  describe('Archive functionality', () => {
    it('should reject invalid URLs', async () => {
      const result = await archiveUrl('invalid-url');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid URL format');
    });

    // Note: The following tests require network access and may be slow
    // Consider mocking the axios calls for unit tests

    it('should check for existing archives', async () => {
      // This is a known archived page
      const result = await checkArchived('https://example.com');

      if (result) {
        expect(result.success).toBe(true);
        expect(result.archiveUrl).toContain('web.archive.org');
        expect(result.isNewSnapshot).toBe(false);
      }
    }, 15000);

    it('should get latest archive', async () => {
      const archiveUrl = await getLatestArchive('https://example.com');

      if (archiveUrl) {
        expect(archiveUrl).toContain('web.archive.org');
      }
    }, 15000);
  });
});
