// actions/park-hours.ts
"use server";

import { editParkHoursAction } from "@/actions/schedule";

export async function editParkHours(rawInput: unknown) {
  return editParkHoursAction(rawInput);
}

export { editParkHoursAction };
