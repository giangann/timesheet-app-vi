import { DEFAULT_PAGI_PARAMS, ROLE_CODE } from "@/constants/Misc";
import { TPagiParams } from "@/types";
import { TApproveDutyFormFilterParams, TDutyCalendarFilterParams, TDutyFormFilterParams } from "./types";
import moment from "moment";
import { paramsObjectToQueryString } from "@/helper/common";

///////////////////////////////////////////////////////////////////////////////
/**
 * DUTY FORMS
 */
export async function fetchMyDutyForms(session: string | undefined | null, pagiParams?: TPagiParams, filterParams?: TDutyFormFilterParams) {
  const token = `Bearer ${session}` ?? "xxx";

  const baseUrl = "https://proven-incredibly-redbird.ngrok-free.app/api/v1";
  const endpoint = "/duty-forms/filter/user";

  const paginationParams = pagiParams ?? DEFAULT_PAGI_PARAMS;
  const { page, size } = paginationParams;
  const queryString = `?page=${page}&size=${size}&sort=id,desc`;

  const url = `${baseUrl}${endpoint}${queryString}`;

  const bodyFilterParams = { ...filterParams };
  if (bodyFilterParams?.createdAt) {
    bodyFilterParams.createdAt = moment(bodyFilterParams?.createdAt).format("YYYY-MM-DD");
  }

  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(bodyFilterParams),
    headers: { "Content-Type": "application/json", Authorization: token },
    credentials: "include",
  });
  const responseJson = await response.json();

  return responseJson;
}

export async function fetchApproveDutyForms(
  session: string | undefined | null,
  pagiParams?: TPagiParams,
  filterParams?: TApproveDutyFormFilterParams
) {
  const token = `Bearer ${session}` ?? "xxx";

  const baseUrl = "https://proven-incredibly-redbird.ngrok-free.app/api/v1";
  const endpoint = "/duty-forms/filter/user-approve";

  const paginationParams = pagiParams ?? DEFAULT_PAGI_PARAMS;
  const { page, size } = paginationParams;
  const queryString = `?page=${page}&size=${size}&sort=id,desc`;

  const url = `${baseUrl}${endpoint}${queryString}`;

  const bodyFilterParams = { ...filterParams };
  if (bodyFilterParams?.createdAt) {
    bodyFilterParams.createdAt = moment(bodyFilterParams?.createdAt).format("YYYY-MM-DD");
  }

  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(bodyFilterParams),
    headers: { "Content-Type": "application/json", Authorization: token },
    credentials: "include",
  });
  const responseJson = await response.json();

  return responseJson;
}

export async function fetchDutyFormDetail(session: string, formId: number) {
  const token = `Bearer ${session}` ?? "xxx";

  const baseUrl = "https://proven-incredibly-redbird.ngrok-free.app/api/v1";
  const endpoint = `/duty-forms/${formId}`;
  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json", Authorization: token },
    credentials: "include",
  });
  const responseJson = await response.json();

  return responseJson;
}

export async function fetchListUserByRole(session: string | null | undefined, roleCode: ROLE_CODE) {
  const token = `Bearer ${session}` ?? "xxx";

  const baseUrl = "https://proven-incredibly-redbird.ngrok-free.app/api/v1";
  const endpoint = "/users/list-user-by-role";
  const queryString = `?role=${roleCode}`;
  const url = `${baseUrl}${endpoint}${queryString}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json", Authorization: token },
    credentials: "include",
  });
  const responseJson = await response.json();

  return responseJson;
}

///////////////////////////////////////////////////////////////////////////
/**
 * DUTY CALENDARS
 */
export async function fetchListDutyCalendarByDateRange(session: string | null | undefined, filterParams?: TDutyCalendarFilterParams) {
  const token = `Bearer ${session}` ?? "xxx";

  const baseUrl = "https://proven-incredibly-redbird.ngrok-free.app/api/v1";
  const endpoint = "/duty-calendars/get-calendar";

  const queryString = paramsObjectToQueryString(filterParams);
  // const queryString = "?startDate=2024-05-07&endDate=2024-12-30";
  const url = `${baseUrl}${endpoint}${queryString}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json", Authorization: token },
    credentials: "include",
  });

  const responseJson = await response.json();

  return responseJson;
}


export async function fetchDutyCalendarDetail(session: string | null | undefined, calendarId: number) {
  const token = `Bearer ${session}` ?? "xxx";

  const baseUrl = "https://proven-incredibly-redbird.ngrok-free.app/api/v1";
  const endpoint = `/duty-calendars/${calendarId}`;

  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json", Authorization: token },
    credentials: "include",
  });

  const responseJson = await response.json();

  return responseJson;
}
