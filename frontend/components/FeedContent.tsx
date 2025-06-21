"use client"

import { useState, useEffect } from "react"
import { MessageCircle, Share, MoreHorizontal, ThumbsUp } from "lucide-react"
import { Card, CardContent, CardHeader } from "./ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Skeleton } from "./ui/skeleton"
import { API } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import ReactionPopover from "./ReactionPopover"
import PostComments from "./PostComments"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import PostModal from "./PostModal"
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
} from "./ui/dropdown-menu"

const REACTION_TYPES = [
	{ type: "like", label: "Like", icon: <ThumbsUp className="h-4 w-4 mr-1" /> },
	{ type: "love", label: "Love", icon: <span className="text-red-500 mr-1">♥</span> },
	{ type: "celebrate", label: "Celebrate", icon: <span className="mr-1">🎉</span> },
	{ type: "insightful", label: "Insightful", icon: <span className="mr-1">💡</span> },
]

export default function FeedContent() {
	const [posts, setPosts] = useState<any[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const { user } = useAuth()
	const { toast } = useToast()
	const [reacting, setReacting] = useState<string | null>(null)
	const [postReactions, setPostReactions] = useState<Record<string, string>>({}) // post_id: type
	const [userReactedPosts, setUserReactedPosts] = useState<Record<string, boolean>>({}) // post_id: reacted
	const [openComments, setOpenComments] = useState<Record<string, boolean>>({})
	const [reactionsCount, setReactionsCount] = useState<Record<string, any>>({})
	const [showReactionsFor, setShowReactionsFor] = useState<string | null>(null)
	const [openPostModal, setOpenPostModal] = useState<string | null>(null)

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await API.Social.getAllPosts()
				const posts = response.data || []
				setPosts(posts)
				// Fetch user's reaction for each post
				const reactions: Record<string, string> = {}
				const userReacted: Record<string, boolean> = {}
				await Promise.all(
					posts.map(async (post: any) => {
						const postId = post.id || post.post_id
						if (!postId) return
						if (!user?.id) return
						try {
							const res = await API.Social.getIsReacted(postId)
							const { reacted, type } = res.data || {}
							if (reacted && type) {
								reactions[postId] = type
								userReacted[postId] = true
							} else {
								userReacted[postId] = false
							}
						} catch (err) {
							console.error(`Error fetching is_reacted for post ${postId}:`, err)
						}
					})
				)
				setPostReactions(reactions)
				setUserReactedPosts(userReacted)
			} catch (error) {
				console.error("Error fetching posts:", error)
			} finally {
				setIsLoading(false)
			}
		}

		fetchData()
	}, [])

	const formatTimeAgo = (timestamp: string) => {
		const date = new Date(timestamp)
		const now = new Date()
		const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

		if (diffInHours < 1) return "Just now"
		if (diffInHours < 24) return `${diffInHours}h ago`
		return `${Math.floor(diffInHours / 24)}d ago`
	}

	const handleReact = async (postId: string, type: string) => {
		if (!user) {
			toast({ title: "Please log in to react to posts." })
			return
		}
		if (!postId || !type) {
			console.error("Invalid react payload", { postId, type })
			toast({ title: "Invalid reaction request" })
			return
		}
		setReacting(postId + type)
		try {
			console.log("Sending react payload", { post_id: String(postId), type: String(type) })
			await API.Social.reactToPost({ post_id: String(postId), type: String(type) })
			setPostReactions((prev) => ({ ...prev, [postId]: type }))
			toast({ title: `You reacted: ${type}` })
		} catch (err) {
			toast({ title: "Failed to react", variant: "destructive" })
		} finally {
			setReacting(null)
		}
	}

	const handleShowReactions = async (postId: string) => {
		try {
			const res = await API.Social.getReactionsCountByType(postId)
			setReactionsCount((prev) => ({ ...prev, [postId]: res.data }))
			setShowReactionsFor(postId)
		} catch {}
	}

	if (isLoading) {
		return (
			<div className="space-y-6">
				{[1, 2, 3].map((i) => (
					<Card key={i}>
						<CardHeader className="pb-3">
							<div className="flex items-center space-x-3">
								<Skeleton className="h-10 w-10 rounded-full" />
								<div className="space-y-2">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-3 w-24" />
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-3/4" />
								<Skeleton className="h-4 w-1/2" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{posts.map((post, idx) => {
				const author = post.advocate?.user
				const postId = post.id || post.post_id
				if (!author || !postId) return null
				const reactionCounts = reactionsCount[postId] || {}

				return (
					<Card key={postId} className="hover:shadow-md transition-shadow">
						<CardHeader className="pb-3">
							<div className="flex items-start justify-between">
								<div className="flex items-center space-x-3 cursor-pointer" onClick={() => setOpenPostModal(postId)}>
									<Avatar className="h-10 w-10">
										<AvatarImage src={author.image || "/placeholder.svg"} alt={author.name} />
										<AvatarFallback>{author.name?.charAt(0)}</AvatarFallback>
									</Avatar>
									<div>
										<div className="flex items-center space-x-2">
											<h4 className="font-semibold text-sm">{author.name}</h4>
											<Badge variant="secondary" className="text-xs">
												Advocate
											</Badge>
										</div>
										<p className="text-xs text-muted-foreground">
											{formatTimeAgo(post.created_at)}
										</p>
									</div>
								</div>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="sm">
											<MoreHorizontal className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem onClick={() => setOpenPostModal(postId)}>
											View Details
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</CardHeader>
						<CardContent className="pt-0">
							<p className="text-sm leading-relaxed mb-4 cursor-pointer" onClick={() => setOpenPostModal(postId)}>{post.text}</p>
							{post.image_url && (
								<div className="mb-4 cursor-pointer" onClick={() => setOpenPostModal(postId)}>
									<img
										src={post.image_url}
										alt="Post attachment"
										className="rounded-lg max-h-64 object-contain border"
									/>
								</div>
							)}
							<div className="flex items-center justify-between pt-3 border-t border-border">
								<div className="flex items-center space-x-2">
									<ReactionPopover
										selected={postReactions[postId]}
										onReact={async (type) => {
											await handleReact(postId, type)
											// Refresh reaction counts after reacting
											const res = await API.Social.getReactionsCountByType(postId)
											setReactionsCount((prev) => ({ ...prev, [postId]: res.data }))
										}}
										loading={reacting?.startsWith(postId)}
									/>
									<span
										className="ml-2 text-xs text-muted-foreground cursor-pointer underline"
										onClick={() => handleShowReactions(postId)}
									>
										{post._count?.reactions || 0} reactions
									</span>
									<Dialog open={showReactionsFor === postId} onOpenChange={() => setShowReactionsFor(null)}>
										<DialogContent className="form-modal-bg">
											<DialogHeader>
												<DialogTitle>Reactions</DialogTitle>
											</DialogHeader>
											<div className="flex gap-4 flex-wrap pt-2">
												{Object.entries(reactionsCount[postId] || {}).map(([type, count]) => (
													<span key={type} className="flex items-center gap-1 text-base">
														{REACTION_TYPES.find((r) => r.type === type)?.icon || type}
														<span>{String(count)}</span>
													</span>
												))}
											</div>
										</DialogContent>
									</Dialog>
								</div>
								<div className="flex items-center space-x-2">
									<Button
										variant="ghost"
										size="sm"
										className={"text-muted-foreground hover:text-green-600" + (openComments[postId] ? " font-bold" : "")}
										onClick={() => setOpenComments((prev) => ({ ...prev, [postId]: !prev[postId] }))}
									>
										<MessageCircle className="h-4 w-4 mr-2" />
										<span className="text-xs">{post._count?.comments || 0}</span>
									</Button>
									<Button
										variant="ghost"
										size="sm"
										className="text-muted-foreground hover:text-purple-600"
										onClick={async () => {
											const url = `${window.location.origin}/post/${postId}`;
											await navigator.clipboard.writeText(url);
											toast({ title: "Post link copied!", description: url });
										}}
									>
										<Share className="h-4 w-4 mr-2" />
										<span className="text-xs">Share</span>
									</Button>
								</div>
							</div>
						</CardContent>
						{/* Render comments section if open */}
						{openComments[postId] && <PostComments postId={postId} />}
					</Card>
				)
			})}
			{/* Post modal for detailed view */}
			{openPostModal && (
				<PostModal postId={openPostModal} open={!!openPostModal} onOpenChange={() => setOpenPostModal(null)} />
			)}
		</div>
	)
}