import React from "react";
import PreferenceCarousel from "./preference-carousel";
import prisma from "@/lib/prismadb";

export default function Page() {
  const updateUserPreferences = async (userPreferences, amenities) => {
    "use server";
    const dbAmenities = {};

    amenities.map((item) => {
      if (item.isRequired) {
        dbAmenities[item.id] = item.isRequired;
      }
    });

    const dbPreferences = { ...userPreferences, ...dbAmenities };

    // await prisma.userPreferences.create({ data: dbPreferences})

    await prisma.userPreferences.upsert({
      where: {
        userId: dbPreferences.userId, // Assuming userId is the unique identifier
      },
      update: dbPreferences,
      create: dbPreferences,
    });
  };
  return (
    <>
      <PreferenceCarousel updateUserPreferences={updateUserPreferences} />
    </>
  );
}
