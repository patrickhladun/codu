import type { Page } from "@playwright/test";
import test, { expect } from "@playwright/test";
import { articleExcerpt, loggedInAsUserOne } from "./utils";

async function openPublishedTab(page: Page) {
  await page.goto("http://localhost:3000/my-posts");
  await page.getByRole("link", { name: "Published" }).click();
  await expect(page).toHaveURL(/\/my-posts\?tab=published$/);
}

async function openDeleteModal(page: Page) {
  await page.getByRole("button", { name: "Options" }).click();
  const optionsDiv = page.locator(
    "div[aria-labelledby='headlessui-menu-button-:r5:']",
  );
  await expect(optionsDiv).toBeVisible();
  const deleteButton = optionsDiv.locator("text=Delete");
  await deleteButton.click();
  const confirmationDiv = page.getByText(
    "Are you sure you want to delete this article?",
  );
  await expect(confirmationDiv).toBeVisible();
}

test.describe("Unauthenticated my-posts Page", () => {
  test("Unauthenticated users should be redirected to get-started page if they access my-posts directly", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/my-posts");
    await page.waitForURL("http://localhost:3000/get-started");
    expect(page.url()).toEqual("http://localhost:3000/get-started");
  });
});

test.describe("Authenticated my-posts Page", () => {
  test.beforeEach(async ({ page }) => {
    await loggedInAsUserOne(page);
  });

  test("Tabs for different type of posts should be visible", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/my-posts");

    await expect(page.getByRole("link", { name: "Drafts" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Scheduled" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Published" })).toBeVisible();
  });

  test("Different article tabs should correctly display articles matching that type", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/my-posts");

    await expect(page.getByRole("link", { name: "Drafts" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Scheduled" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Published" })).toBeVisible();

    await page.getByRole("link", { name: "Drafts" }).click();
    await expect(
      page.getByRole("heading", { name: "Draft Article" }),
    ).toBeVisible();
    await expect(page.getByText(articleExcerpt)).toBeVisible();

    await page.getByRole("link", { name: "Scheduled" }).click();
    await expect(
      page.getByRole("heading", { name: "Scheduled Article" }),
    ).toBeVisible();
    await expect(page.getByText(articleExcerpt)).toBeVisible();

    await page.getByRole("link", { name: "Published" }).click();
    await expect(
      page.getByRole("heading", { name: "Published Article" }),
    ).toBeVisible();
    await expect(page.getByText(articleExcerpt, { exact: true })).toBeVisible();
  });

  test("User should close delete modal with Cancel button", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/my-posts");
    await openPublishedTab(page);
    await openDeleteModal(page);

    const closeButton = page.getByRole("button", { name: "Cancel" });
    await closeButton.click();

    await expect(
      page.locator("text=Are you sure you want to delete this article?"),
    ).toBeHidden();
  });

  test("User should close delete modal with Close button", async ({ page }) => {
    await page.goto("http://localhost:3000/my-posts");
    await openPublishedTab(page);
    await openDeleteModal(page);

    const closeButton = page.getByRole("button", { name: "Close" });
    await closeButton.click();

    await expect(
      page.locator("text=Are you sure you want to delete this article?"),
    ).toBeHidden();
  });

  test("User should delete published article", async ({ page }) => {
    await page.goto("http://localhost:3000/my-posts");
    await openPublishedTab(page);
    await openDeleteModal(page);

    const closeButton = page.getByRole("button", { name: "Delete" });
    await closeButton.click();

    await expect(
      page.getByRole("link", { name: "/articles/e2e-test-slug-published" }),
    ).toHaveCount(0);
  });
});
