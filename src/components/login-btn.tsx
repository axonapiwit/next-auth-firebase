import { useSession, signIn, signOut } from "next-auth/react"

export default function Login() {
  const { data: session } = useSession()
  if (session) {
    return (
      <>
        Signed in as {session.user?.email} <br />
        <button onClick={() => signOut()}>Sign out</button>
      </>
    )
  }
  return (
    <div className="space-y-2">
      Not signed in <br />
      <button className="bg-blue-500 p-2 rounded" onClick={() => signIn()}>Sign in</button>
    </div>
  )
}