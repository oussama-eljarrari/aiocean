import { SignupForm } from "../components/signup-form"
import bgImage from "../assets/wave-blue.png"

export function SignUpPage() {
    return (
        <div className="relative flex min-h-screen items-center justify-center p-6 md:p-10 font-sans text-foreground overflow-hidden">
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${bgImage})` }}
            >
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
            </div>
            <div className="relative w-full max-w-sm md:max-w-4xl z-10">
                <SignupForm />
            </div>
        </div>
    )
}