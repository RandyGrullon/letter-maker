import Link from "next/link";
import { Button } from "@/components/UI/Button";
import { ArrowRight, Mail } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 lg:p-24 relative overflow-hidden pt-16">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-3xl opacity-30 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-100 rounded-full blur-3xl opacity-30 animate-pulse delay-1000" />
      </div>

      <div className="z-10 max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">
        {/* Text Content */}
        <div className="text-center lg:text-left space-y-8">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/50 border border-gray-200 backdrop-blur-sm text-sm text-gray-600 mb-4">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 mr-2"></span>
            The Modern Way to Send Letters
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-gray-900 font-serif leading-tight">
            Craft Digital <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Foldable Letters
            </span>
          </h1>

          <p className="text-xl text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Experience the nostalgia of physical letters with the convenience of the digital age.
            Create, customize, and share beautiful folding letters in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link href="/create">
              <Button size="lg" className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-1 transition-all duration-300 bg-gray-900 text-white">
                Start Writing <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-full border-gray-300 hover:bg-white/50 backdrop-blur-sm">
                Learn More
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="relative lg:h-[600px] flex items-center justify-center perspective-1000">
          <div className="relative w-full max-w-md aspect-[3/4] bg-white rounded-lg shadow-2xl transform rotate-y-12 rotate-x-6 hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-700 ease-out p-8 border border-gray-100 paper-texture">
            <div className="absolute top-4 right-4 text-gray-300">
              <Mail className="h-8 w-8" />
            </div>
            <div className="space-y-6 mt-12">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-5/6" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-32 bg-gray-50 rounded w-full border border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-sm">
                Image Placeholder
              </div>
              <div className="h-4 bg-gray-100 rounded w-1/2 ml-auto" />
            </div>

            {/* Floating Elements */}
            <div className="absolute -right-12 top-1/4 bg-white p-4 rounded-xl shadow-xl border border-gray-100 animate-bounce delay-700">
              <span className="text-2xl">💌</span>
            </div>
            <div className="absolute -left-8 bottom-1/4 bg-white p-4 rounded-xl shadow-xl border border-gray-100 animate-bounce">
              <span className="text-2xl">✨</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
