"use client"

import { useState } from "react"
import { PlusCircle, ImageIcon } from "lucide-react"
import { Card, CardContent } from "./ui/card"
import { Textarea } from "./ui/textarea"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Input } from "./ui/input"
import { API } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"

export default function CreatePostSection({ onPostCreated, forceExpanded }: { onPostCreated?: () => void, forceExpanded?: boolean }) {
  const [postContent, setPostContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [category, setCategory] = useState("CRIMINAL") // Default category
  const [isExpanded, setIsExpanded] = useState(!!forceExpanded)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth()
  const { toast } = useToast()

  // If forceExpanded is true, always show the form
  const expanded = forceExpanded || isExpanded;

  const handlePost = async () => {
    if (!postContent.trim()) return
    setLoading(true)
    try {
      await API.Social.createPost({ text: postContent, image_url: imageUrl || undefined, category })
      toast({ title: "Post created!" })
      setPostContent("")
      setImageUrl("")
      setIsExpanded(false)
      if (onPostCreated) onPostCreated();
    } catch (err: any) {
      toast({ title: "Failed to create post", description: err?.response?.data?.error || err.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  // Handle file input change for document/image upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await API.Upload.uploadFile(file);
      if (res.data?.url) {
        setImageUrl(res.data.url);
        toast({ title: "File Uploaded", description: "File uploaded successfully." });
      } else {
        toast({ title: "Upload Failed", description: "No URL returned.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err?.response?.data?.error || "Upload failed.", variant: "destructive" });
    }
    setUploading(false);
  };

  if (user?.userType !== "advocate") return null

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.image || "/placeholder.svg"} alt={user?.name} />
            <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            {!expanded ? (
              <button
                onClick={() => setIsExpanded(true)}
                className="w-full text-left p-3 rounded-full border border-border hover:bg-muted transition-colors text-muted-foreground"
              >
                Share your legal insights...
              </button>
            ) : (
              <div className="space-y-3">
                <Textarea
                  placeholder="Share your legal insights, case updates, or legal tips..."
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="min-h-[120px] resize-none border-0 p-0 focus-visible:ring-0"
                  autoFocus
                />

                {/* Category Dropdown */}
                <div className="flex items-center space-x-2">
                  <label htmlFor="category" className="text-sm ">Category:</label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`border p-2 rounded-md w-full max-w-[200px] text-black`}
                  >
                    <option value="CRIMINAL" className="text-black">Criminal</option>
                    <option value="CIVIL" className="text-black">Civil</option>
                    <option value="CORPORATE" className="text-black">Corporate</option>
                    <option value="FAMILY" className="text-black">Family</option>
                    <option value="CYBER" className="text-black">Cyber</option>
                    <option value="INTELLECTUAL_PROPERTY" className="text-black">Intellectual Property</option>
                    <option value="TAXATION" className="text-black">Taxation</option>
                    <option value="LABOR" className="text-black">Labor</option>
                    <option value="ENVIRONMENT" className="text-black">Environment</option>
                    <option value="HUMAN_RIGHTS" className="text-black">Human Rights</option>
                    <option value="AADHAAR_LAW" className="text-black">Aadhaar Law</option>
                    <option value="BIRTH_DEATH_MARRIAGE_REGISTRATION" className="text-black">Birth/Death/Marriage Registration</option>
                    <option value="CONSUMER_PROTECTION" className="text-black">Consumer Protection</option>
                    <option value="CHILD_LAW" className="text-black">Child Law</option>
                    <option value="DOWRY_PROHIBITION" className="text-black">Dowry Prohibition</option>
                    <option value="DRUG_AND_COSMETICS_LAW" className="text-black">Drug and Cosmetics Law</option>
                    <option value="OTHER" className="text-black">Other</option>
                  </select>
                </div>

                {/* Single upload button for image/document */}
                <div className="flex items-center gap-2 mt-2">
                  <label htmlFor="file-upload-trigger" className="flex items-center cursor-pointer">
                    <Button variant="ghost" size="sm" asChild disabled={uploading}>
                      <span className="flex items-center">
                        <ImageIcon className="h-4 w-4 mr-2" />
                        {uploading ? "Uploading..." : "Upload Image/Doc"}
                      </span>
                    </Button>
                    <Input
                      id="file-upload-trigger"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  {imageUrl && !uploading && (
                    <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline ml-2">View Uploaded File</a>
                  )}
                </div>
                
                {/* Post action buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsExpanded(false)
                        setPostContent("")
                        setImageUrl("")
                        if (onPostCreated) onPostCreated(); // Close modal if in dialog
                      }}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handlePost} disabled={!postContent.trim() || loading}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      {loading ? "Posting..." : "Post"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
