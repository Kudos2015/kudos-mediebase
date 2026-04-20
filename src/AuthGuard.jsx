import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export default function AuthGuard({ children }) {
  const [checked, setChecked] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setOk(true);
      } else {
        window.location.href = "https://kudos-crm.vercel.app";
      }
      setChecked(true);
    });
  }, []);

  if (!checked) return null;
  if (!ok) return null;
  return children;
}
