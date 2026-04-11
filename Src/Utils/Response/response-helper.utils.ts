import { IFailureResponse, ISuccessResponse } from "../../Common";

export function successResponse<T>(
  message = "Your Request was successful",
  data?: T,
  status = "ok"
): ISuccessResponse {
  return {
    meta: {
      status,
      success: true,
    },
    data: {
      message,
      data,
    },
  };
}

export function failedResponse(
  message = "Your Request is Failed",
  error?: object,
  status = 500
): IFailureResponse {
  return {
    meta: {
      status,
      success: false,
    },
    error: {
      message,
      context: error,
    },
  };
}
