-- AlterTable
ALTER TABLE "advocates" ADD COLUMN     "working_days" TEXT[] DEFAULT ARRAY['MON', 'TUE', 'WED', 'THU', 'FRI']::TEXT[],
ADD COLUMN     "working_hours" INTEGER[] DEFAULT ARRAY[10, 17]::INTEGER[];
