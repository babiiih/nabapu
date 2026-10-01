/**
 * Tombol login Privy (email / Google / wallet — embedded).
 * Alternatif buat user yang gak punya / males pakai MetaMask:
 * gak ada popup extension → error -32002 ("permintaan tertunda") mustahil terjadi.
 */
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";

export default function PrivyLoginButton({
  size = "sm",
  label = "Email / Google login",
}: {
  size?: "sm" | "default";
  label?: string;
}) {
  const { ready, authenticated, login } = usePrivy();
  if (authenticated) return null;
  return (
    <Button
      variant="outline"
      size={size}
      onClick={() => login()}
      disabled={!ready}
      title="Login tanpa MetaMask — wallet dibikin otomatis"
    >
      {label}
    </Button>
  );
}
