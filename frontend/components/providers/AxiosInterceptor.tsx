"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { AXIOS_INSTANCE } from "@/lib/api/axios-instance";

export function AxiosInterceptor({ children }: { children: React.ReactNode }) {
    const { getToken } = useAuth();

    useEffect(() => {
        const interceptorId = AXIOS_INSTANCE.interceptors.request.use(
            async (config) => {
                const token = await getToken();
                console.log("Interceptor: Token retrieved", !!token); // DEBUG
                if (token) {
                    config.headers["Authorization"] = `Bearer ${token}`;
                    console.log("Interceptor: Attached Authorization header"); // DEBUG
                }
                return config;
            },
            (error) => {
                console.error("Interceptor: Error", error); // DEBUG
                return Promise.reject(error);
            }
        );

        return () => {
            AXIOS_INSTANCE.interceptors.request.eject(interceptorId);
        };
    }, [getToken]);

    return <>{children}</>;
}
