import { UserForm } from "./components/ui/UserForm";

export default function ContactPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">Formularz kontaktowy</h1>
      <UserForm />
    </div>
  )
}
