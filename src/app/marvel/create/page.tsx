import { AuthGuard } from "@/components/auth-guard";
import { CreateMarvelBoardScreen } from "@/components/marvel/create-marvel-board-screen";

export default function CreateMarvelPage() {
  return (
    <AuthGuard>
      <CreateMarvelBoardScreen />
    </AuthGuard>
  );
}
