import { Button, Center, Paper, Stack, TextInput, Title } from "@mantine/core";

function AuthenticationPage() {
  return (
    <Center mih="100vh">
      <Paper withBorder miw={500} py="lg" px="lg">
        <Stack mb="md">
          <Title>Log in</Title>
          <TextInput label="Username" placeholder="Username" />
          <TextInput label="Password" placeholder="Password" type="password" />
          <Button>Log in</Button>
        </Stack>
      </Paper>
    </Center>
  );
}

export default AuthenticationPage;
