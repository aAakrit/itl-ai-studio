/* eslint-disable prettier/prettier */
import { api, endpoints } from "./api/api";
import { useAuthStore } from "@/store/authStore";

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  mobile: string;
  city: string;
  state: string;
  pincode: string;
  firm?: string;
  address?: string;
  telephone?: string;
  gstin?: string;
  /** "bridge" when registering from the ITL Bridge AI pages. */
  product?: string;
}

export const authService = {
  async login(email: string, password: string, remember: boolean) {
    const { data } = await api.post(endpoints.auth.login, {
      email,
      password,
      remember,
    });

    if (data.access_token) {
      useAuthStore.getState().setSession(
        data.user,
        data.access_token,
      );
    }

    return data;
  },

  async register(payload: RegisterPayload) {
    const { data } = await api.post(endpoints.auth.register, {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      mobile: payload.mobile,
      city: payload.city,
      state: payload.state,
      pin_code: payload.pincode,
      firm: payload.firm,
      address: payload.address,
      telephone: payload.telephone,
      gstin: payload.gstin,
      product: payload.product,
    });

    return data;
  },

  async logout() {
    try {
      await api.post(endpoints.auth.logout);
    } finally {
      useAuthStore.getState().clear();
    }
  },

  async me() {
    const { data } = await api.get(endpoints.auth.me);
    return data;
  },

  async requestPasswordOtp(email: string): Promise<void> {
    await api.post(endpoints.auth.passwordOtpRequest, { email });
  },

  async verifyPasswordOtp(email: string, otp: string): Promise<{ ok: boolean }> {
    const { data } = await api.post(endpoints.auth.passwordOtpVerify, { email, otp });
    return data;
  },

  async resetPassword(email: string, otp: string, password: string): Promise<void> {
    await api.post(endpoints.auth.passwordReset, { email, otp, password });
  },

  // Email-verification OTP is not part of this build — registration goes
  // straight to "pending admin approval" instead of an email-verify step.
  async requestEmailOtp(_email: string): Promise<void> {
    throw new Error("Not implemented");
  },

  async verifyEmailOtp(_email: string, _otp: string): Promise<{ ok: boolean }> {
    throw new Error("Not implemented");
  },
};