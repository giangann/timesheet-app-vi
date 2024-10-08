import { TCredentials } from "./type";

export const loginByCredentials = async (credentials: TCredentials) => {
  const baseUrl = "https://proven-incredibly-redbird.ngrok-free.app/api/v1";
  const endpoint = "/auth/login";
  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
    credentials: "include",
  });

  const responseJson = await response.json();
  return responseJson;
};

export const verifyToken = async (token: string) => {
  const baseUrl = "https://proven-incredibly-redbird.ngrok-free.app/api/v1";
  const endpoint = "/auth/verify-token";
  const queryString = `?token=${token}`;
  const url = `${baseUrl}${endpoint}${queryString}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  const responseJson = await response.json();
  return responseJson;
};
