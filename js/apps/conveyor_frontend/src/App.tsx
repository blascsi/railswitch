import "@mantine/core/styles.css";
import "./App.css";
import { MantineProvider } from "@mantine/core";
import { AuthenticationPage } from "./pages/Authentication.page";

export function App() {
  return (
    <MantineProvider defaultColorScheme="auto">
      <AuthenticationPage />
    </MantineProvider>
  );
}
