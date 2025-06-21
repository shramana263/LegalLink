import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { API } from "@/lib/api";
import PostComments from "./PostComments";
import ReactionPopover from "./ReactionPopover";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { ThumbsUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const REACTION_TYPES = [
	{ type: "like", label: "Like", icon: <ThumbsUp className="h-4 w-4 mr-1" /> },
	{ type: "love", label: "Love", icon: <span className="text-red-500 mr-1">♥</span> },
	{ type: "celebrate", label: "Celebrate", icon: <span className="mr-1">🎉</span> },
	{ type: "insightful", label: "Insightful", icon: <span className="mr-1">💡</span> },
];

interface PostModalProps {
	postId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export default function PostModal({ postId, open, onOpenChange }: PostModalProps) {
	const { user } = useAuth();
	const [post, setPost] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [reactionsCount, setReactionsCount] = useState<Record<string, number>>({});
	const [myReaction, setMyReaction] = useState<string>("");

	useEffect(() => {
		if (!postId || !open) return;
		setLoading(true);
		API.Social.getPostById(postId).then((res) => {
			setPost(res.data);
			setLoading(false);
		});
		API.Social.getReactionsCountByType(postId).then((res) => setReactionsCount(res.data));
		if (user) {
			API.Social.getMyReaction(postId)
				.then((res) => setMyReaction(res.data?.type || ""))
				.catch((err) => {
					if (err?.response?.status !== 403) console.error(err);
					setMyReaction("");
				});
		} else {
			setMyReaction("");
		}
	}, [postId, open, user]);

	if (!open) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl p-0 flex flex-row form-modal-bg">
				<DialogTitle className="sr-only">Post Details</DialogTitle>
				{/* Left: Post details */}
				<div className="w-1/2 p-6 border-r border-border flex flex-col justify-center">
					{loading ? (
						<div>Loading...</div>
					) : post ? (
						<>
							<div className="flex items-center mb-4">
								<Avatar className="h-10 w-10">
									<AvatarImage src={post.advocate?.user?.image || "/placeholder.svg"} alt={post.advocate?.user?.name} />
									<AvatarFallback>{post.advocate?.user?.name?.charAt(0)}</AvatarFallback>
								</Avatar>
								<div className="ml-3">
									<div className="font-semibold text-sm">{post.advocate?.user?.name}</div>
									<Badge variant="secondary" className="text-xs">Advocate</Badge>
								</div>
							</div>
							<div className="mb-4 text-base">{post.text}</div>
							{post.image_url && (
								<img src={post.image_url} alt="Post attachment" className="rounded-lg max-h-64 object-contain border" />
							)}
							<div className="text-xs text-muted-foreground mt-2">{new Date(post.created_at).toLocaleString()}</div>
						</>
					) : (
						<div>Post not found.</div>
					)}
				</div>
				{/* Right: Reactions and comments */}
				<div className="w-1/2 flex flex-col h-full">
					<div className="flex flex-col flex-1 p-6">
						{/* Reactions */}
						<div className="mb-4">
							<ReactionPopover
								selected={myReaction}
								onReact={async (type) => {
									await API.Social.reactToPost({ post_id: postId, type });
									setMyReaction(type);
									const res = await API.Social.getReactionsCountByType(postId);
									setReactionsCount(res.data);
								}}
								loading={false}
							/>
							<div className="flex gap-4 pt-2">
								{Object.entries(reactionsCount || {}).map(([type, count]) => (
									<span key={type} className="flex items-center gap-1 text-base">
										{REACTION_TYPES.find((r) => r.type === type)?.icon || type}
										<span>{String(count)}</span>
									</span>
								))}
							</div>
						</div>
						{/* Comments */}
						<div className="flex-1 overflow-y-auto">
							<PostComments postId={postId} />
						</div>
					</div>
					{/* Comment input at bottom right
					<div className="p-6 border-t border-border bg-background">
						<PostComments postId={postId} showInputOnly />
					</div> */}
				</div>
			</DialogContent>
		</Dialog>
	);
}
