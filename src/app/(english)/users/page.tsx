import View from "@/views/UsersPage";
import { routeMeta } from "@/lib/meta";

export const metadata = routeMeta("/users");

export default function Page() {
  return <View />;
}
