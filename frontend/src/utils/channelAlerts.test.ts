import { describe, expect, it } from "vitest";
import { selectCurrentChannelAlert } from "./channelAlerts";

const alert = (id: string, version: number, alertKind = "RECEPTION") => ({ id, version, alertKind });

describe("selectCurrentChannelAlert", () => {
  it("selects the oldest pending alert when no alert is open", () => {
    expect(selectCurrentChannelAlert(null, [alert("first", 1), alert("second", 1)]))
      .toEqual(alert("first", 1));
  });

  it("keeps the open alert while the same immutable version remains pending", () => {
    const current = alert("order-1", 3);
    expect(selectCurrentChannelAlert(current, [alert("order-2", 1), current])).toBe(current);
  });

  it("replaces a stale alert after the order changes or is acknowledged", () => {
    expect(selectCurrentChannelAlert(alert("order-1", 1), [alert("order-1", 2)]))
      .toEqual(alert("order-1", 2));
    expect(selectCurrentChannelAlert(alert("order-1", 1), [])).toBeNull();
  });

  it("treats reception and preparation reminders as different alerts", () => {
    expect(selectCurrentChannelAlert(alert("order-1", 4), [alert("order-1", 4, "PREPARATION")]))
      .toEqual(alert("order-1", 4, "PREPARATION"));
  });
});
