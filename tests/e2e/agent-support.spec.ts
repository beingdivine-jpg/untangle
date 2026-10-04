import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const b = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true });
const volunteer = {
  id: "00000000-0000-4000-8000-000000000002",
  name: "Alex — test volunteer",
  expertise: "Help understanding account settings",
  languages: "en,pl",
  verifiedAt: "2026-10-04T00:00:00Z",
};
async function service(
  page: Page,
  options: { admin?: boolean; ai?: boolean } = {},
) {
  const calls: { action: string; args: Record<string, unknown> }[] = [],
    messages: {
      id: string;
      author_id: string;
      body: string;
      created_at: string;
    }[] = [];
  let application: Record<string, unknown> | null = null,
    requests: Record<string, unknown>[] = [];
  await page.route("**/api/community", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({
        json: { available: true, ai: options.ai ?? false },
      });
    const body = route.request().postDataJSON();
    calls.push(body);
    if (body.action === "send_code")
      return route.fulfill({ json: { sent: true } });
    if (body.action === "verify_code")
      return route.fulfill({
        json: {
          token: "test-token",
          userId: "user-1",
          expiresAt: Date.now() + 3600000,
        },
      });
    if (body.action === "community_snapshot")
      return route.fulfill({
        json: {
          admin: !!options.admin,
          application,
          applications: options.admin
            ? [
                {
                  user_id: volunteer.id,
                  display_name: volunteer.name,
                  expertise: volunteer.expertise,
                  experience:
                    "Test volunteer application — three years of account-support experience.",
                  languages: "en",
                  status: "pending",
                },
              ]
            : [],
          directory: [volunteer],
          requests,
          reports: [],
        },
      });
    if (body.action === "apply_volunteer")
      application = {
        ...body.args,
        display_name: body.args.name,
        status: "pending",
      };
    if (body.action === "request_support")
      requests = [
        {
          id: "request-1",
          owner_id: "user-1",
          volunteer_id: volunteer.id,
          volunteerName: volunteer.name,
          summary: body.args.message,
          status: "open",
          created_at: new Date().toISOString(),
        },
      ];
    if (body.action === "read_support")
      return route.fulfill({ json: messages });
    if (body.action === "reply_support")
      messages.push({
        id: "message-1",
        author_id: "user-1",
        body: body.args.message,
        created_at: new Date().toISOString(),
      });
    if (body.action === "manage_support") requests = [];
    return route.fulfill({ json: { ok: true } });
  });
  return calls;
}
async function login(page: Page) {
  await page
    .getByLabel("Email for your sign-in code")
    .fill("fixture@example.test");
  await b(page, "Send me a sign-in code").click();
  await page.getByLabel("Email code", { exact: true }).fill("123456");
  await b(page, "Verify and sign in").click();
}

test("assistant and skip shortcuts preserve the selected guide and its progress", async ({ page }) => {
  await page.goto("/?view=resolve");
  await page.getByLabel("What are we working on?").selectOption("maps");
  await b(page, "I’m ready for the next step").click();
  await expect(page.getByText("STEP 2 / 2", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Ask the assistant about this step", exact: true }).click();
  await expect(page.locator("#step-assistant")).toBeFocused();
  await expect(page.getByLabel("What are we working on?")).toHaveValue("maps");
  await expect(page.getByText("STEP 2 / 2", { exact: true })).toBeVisible();
  const skip = page.getByRole("link", { name: "Skip to content", exact: true });
  await skip.focus();
  await skip.press("Enter");
  await expect(page.locator("#working-main")).toBeFocused();
  await expect(page.getByLabel("What are we working on?")).toHaveValue("maps");
  expect(new URL(page.url()).hash).toBe("");
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Choose one thread to begin.", exact: true })).toBeVisible();
});

test("resolution teaches, records only approved observations, and preserves the plan", async ({
  page,
}) => {
  await page.goto("/?view=resolve");
  await page.getByLabel("What are we working on?").selectOption("maps");
  await b(page, "Help me understand").click();
  await b(page, "No").click();
  await expect(page.getByRole("status")).toContainText("That’s right");
  await b(page, "Work through a step").click();
  await b(page, "I’m ready for the next step").click();
  await b(page, "I checked my Google Maps sharing list").click();
  await expect(
    page.getByText("Your update is kept in this tab.", { exact: true }),
  ).not.toBeVisible();
  await b(page, "Keep this update in my plan").click();
  await expect(page.getByRole("status")).toContainText(
    "This records what you reported",
  );
  await b(page, "My plan").click();
  await expect(
    page.locator(".p-task-row").filter({ hasText: "Google Maps" }),
  ).toContainText("Reviewed by me");
  await b(page, "Work through it with me").click();
  await expect(
    page.getByRole("heading", { name: "Let’s work through it." }),
  ).toBeVisible();
});

test("unconfigured services never fake AI or volunteer availability; Polish phone layout is accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?lang=pl&view=people");
  await expect(
    page.getByRole("heading", {
      name: "Pomoc wolontariuszy nie jest jeszcze dostępna.",
    }),
  ).toBeVisible();
  await expect(page.locator("input[type=email]")).toHaveCount(0);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/?lang=pl&view=resolve");
  await page.getByLabel("Nad czym pracujemy?").selectOption("devices");
  await expect(page.locator(".coach-availability")).toContainText(
    "AI nie jest jeszcze podłączone",
  );
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("AI tool activity follows a real request and nothing is sent before exact-field approval", async ({
  page,
}) => {
  await service(page, { ai: true });
  let sent: unknown = null;
  await page.route("**/api/coach", async (route) => {
    sent = route.request().postDataJSON();
    await route.fulfill({
      contentType: "application/x-ndjson",
      body: [
        { stage: "reading" },
        { stage: "tool", tool: "read_guide", guide: "devices" },
        { stage: "checking" },
        {
          stage: "ready",
          answer: {
            explanation: "One laptop can have more than one session.",
            nextStep: "Read the signed-out label.",
            why: "A device name does not identify a person.",
            checkQuestion: "Does this entry say signed out?",
            sourceIds: ["devices"],
          },
        },
      ]
        .map((e) => JSON.stringify(e) + "\n")
        .join(""),
    });
  });
  await page.goto("/?view=resolve");
  await page.getByLabel("What are we working on?").selectOption("devices");
  await page
    .getByLabel("Your question about this step")
    .fill("Why might one laptop appear twice?");
  await b(page, "Review what the AI will receive").click();
  await login(page);
  await b(page, "Review what the AI will receive").click();
  await expect(
    page.getByRole("heading", { name: "Send this to OpenAI?" }),
  ).toBeVisible();
  expect(sent).toBeNull();
  await b(page, "Send this question").click();
  await expect(page.locator(".coach-answer")).toContainText(
    "One laptop can have more than one session.",
  );
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(sent).toEqual({
    taskId: "devices",
    question: "Why might one laptop appear twice?",
    locale: "en",
  });
  await expect(page.locator(".agent-activity")).toContainText(
    "Retrieved guide",
  );
  await expect(page.locator(".agent-activity")).toContainText(
    "Look at devices using your Google account",
  );
  await expect(
    page.getByText("Your update is kept in this tab.", { exact: true }),
  ).not.toBeVisible();
  await b(page, "Discard this suggestion").click();
  await expect(page.locator(".coach-answer")).toHaveCount(0);
});

test("a support request previews only the chosen message and conversations can be deleted", async ({
  page,
}) => {
  const calls = await service(page);
  await page.goto("/?view=people");
  await login(page);
  await expect(page.getByText("Signed in · this tab only")).toBeVisible();
  await b(page, "Prepare my question").click();
  await page
    .getByLabel("Your question", { exact: true })
    .fill("Can you help me understand the device list?");
  await page.getByRole("checkbox", { name: "I am 18 or older." }).check();
  await b(page, "Preview my request").click();
  expect(calls.filter((c) => c.action === "request_support")).toHaveLength(0);
  await expect(page.locator(".shared-preview")).toHaveText(
    "Can you help me understand the device list?",
  );
  await expect(
    page.getByRole("heading", { name: "Review before sharing" }),
  ).toBeFocused();
  await b(page, "Share this message and request help").click();
  await expect(page.locator(".conversation-row")).toHaveCount(1);
  expect(calls.find((c) => c.action === "request_support")?.args).toEqual({
    volunteer: volunteer.id,
    message: "Can you help me understand the device list?",
    adult: true,
  });
  await page.locator(".conversation-row").click();
  await page
    .getByLabel("Message to this conversation")
    .fill("I found two entries.");
  await b(page, "Send message").click();
  await expect(page.locator(".message-list")).toContainText(
    "I found two entries.",
  );
  await b(page, "Delete request and messages").click();
  expect(calls.filter((c) => c.action === "manage_support")).toHaveLength(0);
  await b(page, "Confirm").click();
  await expect(
    page.getByText("No requests yet. Choose a volunteer to begin."),
  ).toBeVisible();
  await b(page, "Sign out").click();
  await expect(page.getByText("Signed in · this tab only")).not.toBeVisible();
  await expect(page.locator(".message-list")).toHaveCount(0);
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
    })),
  ).toEqual({ local: 0, session: 0 });
});

test("volunteers create an account and application stays pending with no self-approval controls", async ({
  page,
}) => {
  const calls = await service(page);
  await page.goto("/?view=people");
  await b(page, "Become a volunteer").click();
  await login(page);
  await expect(
    page.getByRole("heading", { name: "Apply to support someone" }),
  ).toBeVisible();
  await page.getByLabel("Public display name").fill("Test volunteer");
  await page
    .getByLabel("What you can help with (shown on your profile)")
    .fill("Help with digital account settings");
  await page
    .getByLabel("Relevant experience and how the team can verify it")
    .fill(
      "Three years of test experience; verification through the programme coordinator.",
    );
  await page.getByRole("checkbox", { name: "I am at least 18." }).check();
  await page
    .getByRole("checkbox", { name: /I will respect confidentiality/ })
    .check();
  await b(page, "Submit for team verification").click();
  await expect(
    page.getByText("Awaiting team verification", { exact: true }),
  ).toBeVisible();
  await expect(b(page, "Review applications")).toHaveCount(0);
  expect(
    calls.find((c) => c.action === "apply_volunteer")?.args,
  ).not.toHaveProperty("status");
});

test("admin review has concrete evidence checks and a recorded decision", async ({
  page,
}) => {
  const calls = await service(page, { admin: true });
  await page.goto("/?view=people");
  await login(page);
  await b(page, "Review applications").click();
  await page
    .getByRole("checkbox", {
      name: "Identity verified through our review process",
    })
    .check();
  await page
    .getByRole("checkbox", { name: "Relevant experience and scope checked" })
    .check();
  await page
    .getByRole("checkbox", {
      name: "Safeguarding and conduct reviewed with applicant",
    })
    .check();
  await page
    .getByLabel("Verification record (no identity document numbers)")
    .fill("Independent evidence checked by our test reviewer.");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await b(page, "Save review decision").click();
  await expect
    .poll(() => calls.some((c) => c.action === "review_volunteer"))
    .toBe(true);
  expect(
    calls.find((c) => c.action === "review_volunteer")?.args,
  ).toMatchObject({
    person: volunteer.id,
    decision: "approved",
    identity_checked: true,
    experience_checked: true,
    conduct_checked: true,
  });
});

test("leaving an AI request aborts it and a late response cannot restore it", async ({
  page,
}) => {
  await service(page, { ai: true });
  let received = false;
  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/coach", async (route) => {
    received = true;
    await held;
    await route
      .fulfill({
        contentType: "application/x-ndjson",
        body: JSON.stringify({ stage: "error" }) + "\n",
      })
      .catch(() => {});
  });
  await page.goto("/?view=resolve");
  await page.getByLabel("What are we working on?").selectOption("devices");
  await page
    .getByLabel("Your question about this step")
    .fill("Why are there two sessions?");
  await b(page, "Review what the AI will receive").click();
  await login(page);
  await expect(
    page.getByRole("region", { name: "AI request preview" }),
  ).toBeFocused();
  await b(page, "Send this question").click();
  await expect.poll(() => received).toBe(true);
  await b(page, "Human support").click();
  release();
  await expect(
    page.getByRole("heading", {
      name: "You do not have to figure it out alone.",
    }),
  ).toBeVisible();
  await b(page, "Work through it").click();
  await page.getByLabel("What are we working on?").selectOption("devices");
  await expect(page.locator(".coach-answer")).toHaveCount(0);
  await expect(page.locator(".agent-activity")).toHaveCount(0);
  await expect(page.getByLabel("Your question about this step")).toHaveValue(
    "",
  );
});


test('recording an assisted outcome preserves an unfinished private reminder',async({page})=>{
 await page.goto('/?view=resolve');await page.getByLabel('What are we working on?').selectOption('maps');await b(page,'I want to pause').click();await b(page,'Keep this update in my plan').click();await b(page,'My plan').click()
 await page.locator('.p-task-row').filter({hasText:'Google Maps'}).click();await page.getByRole('button',{name:/My update/}).click();await page.getByLabel(/A reminder for yourself/).fill('Remember to ask about a second app.');await b(page,'Work through it with me').click();await b(page,'I’m stuck or unsure').click();await b(page,'Keep this update in my plan').click();await b(page,'My plan').click();await page.locator('.p-task-row').filter({hasText:'Google Maps'}).click();await page.getByRole('button',{name:/My update/}).click();await expect(page.getByLabel(/A reminder for yourself/)).toHaveValue('Remember to ask about a second app.')
})
