-- DropForeignKey
ALTER TABLE "advocate_cases" DROP CONSTRAINT "advocate_cases_advocate_id_fkey";

-- DropForeignKey
ALTER TABLE "advocate_ratings" DROP CONSTRAINT "advocate_ratings_advocate_id_fkey";

-- DropForeignKey
ALTER TABLE "advocate_specializations" DROP CONSTRAINT "advocate_specializations_advocate_id_fkey";

-- DropForeignKey
ALTER TABLE "post_comments" DROP CONSTRAINT "post_comments_post_id_fkey";

-- DropForeignKey
ALTER TABLE "post_reactions" DROP CONSTRAINT "post_reactions_post_id_fkey";

-- AddForeignKey
ALTER TABLE "advocate_specializations" ADD CONSTRAINT "advocate_specializations_advocate_id_fkey" FOREIGN KEY ("advocate_id") REFERENCES "advocates"("advocate_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advocate_ratings" ADD CONSTRAINT "advocate_ratings_advocate_id_fkey" FOREIGN KEY ("advocate_id") REFERENCES "advocates"("advocate_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advocate_cases" ADD CONSTRAINT "advocate_cases_advocate_id_fkey" FOREIGN KEY ("advocate_id") REFERENCES "advocates"("advocate_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_reactions" ADD CONSTRAINT "post_reactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "advocate_posts"("post_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "advocate_posts"("post_id") ON DELETE CASCADE ON UPDATE CASCADE;
