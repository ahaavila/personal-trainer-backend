-- CreateTable
CREATE TABLE "ApplicationMetadata" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationMetadata_pkey" PRIMARY KEY ("id")
);
