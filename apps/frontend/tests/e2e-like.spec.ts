import { test, expect } from '@playwright/test';

test.describe('Like button e2e', () => {
  test('single click updates like and UI stays stable', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('auth_token', 'test-token');
        const persisted = {
          state: {
            user: {
              id: 'u1',
              email: 'user@example.com',
              namaLengkap: 'User',
              isEmailVerified: true,
              createdAt: new Date().toISOString(),
              profile: {
                username: 'user',
                profileImageUrl: null,
                umur: 20,
                tanggalLahir: new Date().toISOString(),
                tempatKelahiran: 'ID',
                isOnboardingComplete: true,
              },
            },
            token: 'test-token',
            isAuthenticated: true,
          },
        };
        localStorage.setItem('auth-storage', JSON.stringify(persisted));
      } catch {}
    });
    await page.route('**/posts/feed?mode=following', async (route) => {
      const mock = {
        data: [
          {
            id: 'post1',
            content: '<p>Hello</p>',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            author: { id: 'u1', namaLengkap: 'User', profile: { username: 'user', profileImageUrl: null } },
            images: [],
            videos: [],
            _count: { likes: 0, comments: 0, bookmarks: 0 },
            isLiked: false,
            isBookmarked: false,
            title: 'Hello',
            type: 'text',
            hashtags: [],
            links: [],
            isFollowing: false,
          },
        ],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(mock) });
    });

    await page.route('**/likes/posts/**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ message: 'ok' }), status: 201 });
      } else {
        await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ message: 'ok' }), status: 200 });
      }
    });

    await page.goto('/feed');
    await page.waitForSelector('article');
    const firstCard = page.locator('article').first();
    const likeButton = firstCard.locator('button').first();
    const likesBtn = firstCard.locator('button:has-text("likes")');
    const beforeText = (await likesBtn.textContent()) || '';
    const beforeBox = await firstCard.boundingBox();

    await likeButton.click();
    await page.waitForTimeout(150);
    const afterText = (await likesBtn.textContent()) || '';
    const afterBox = await firstCard.boundingBox();

    expect(afterText).not.toEqual(beforeText);
    expect(beforeBox?.width).toBeCloseTo(afterBox?.width || 0);
    expect(beforeBox?.height).toBeCloseTo(afterBox?.height || 0);
  });
});
