export const dynamic = "force-static";

export async function GET() {
  const res = await fetch("https://jsonplaceholder.typicode.com/todos/3");
  const data = { message: "Hello from the API route!", ...(await res.json()) };

  return Response.json({ data });
}
