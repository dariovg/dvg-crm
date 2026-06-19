// app/marketing/create/page.tsx
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import authOptions from "@/app/api/auth/[...nextauth]/auth-options";
import { PublishForm } from "@/components/marketing/PublishForm";

export default async function CreatePostPage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "MARKETING") {
    redirect("/dashboard");
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">✍️ Create New Post</h1>
        <p className="text-gray-600">
          Create a social media post for review and approval
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <PublishForm />
        </div>

        {/* Tips sidebar */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4 text-blue-900">💡 Tips</h3>
          <div className="space-y-4 text-sm text-blue-800">
            <div>
              <p className="font-semibold">Character Limits</p>
              <p className="text-xs mt-1">Twitter: 280 • TikTok: 150 • Instagram: 2,200</p>
            </div>
            <div>
              <p className="font-semibold">Best Times to Post</p>
              <p className="text-xs mt-1">Weekdays 9-11 AM get 40% more engagement</p>
            </div>
            <div>
              <p className="font-semibold">Hashtag Strategy</p>
              <p className="text-xs mt-1">Use 3-5 relevant hashtags per platform</p>
            </div>
            <div>
              <p className="font-semibold">Media Tips</p>
              <p className="text-xs mt-1">Images increase engagement by 3x</p>
            </div>
            <div>
              <p className="font-semibold">Scheduling</p>
              <p className="text-xs mt-1">
                Schedule posts for optimal audience availability
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
