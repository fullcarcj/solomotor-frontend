import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMenu } from "@/store/menuSlice";

export function useMenu() {
  const dispatch = useAppDispatch();
  const { data, loading, error, role, canal } = useAppSelector((s) => s.menu);

  useEffect(() => {
    if (data !== null || loading || error) return;
    dispatch(fetchMenu());
  }, [data, loading, error, dispatch]);

  return { menu: data, loading, error, role, canal };
}
