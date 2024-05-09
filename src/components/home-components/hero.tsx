import React from "react";
import Image from "next/image";
import Container from "../container";
import SearchContainer from "./searchContainer";
import prisma from "@/lib/prismadb";
import { Trip } from "@/types";
import { currentUser } from "@clerk/nextjs/server";

export default async function Hero() {
  const createTrip = async (trip: Trip) => {
    "use server";

    // Check if there is a user with the provided userId
    const userExists = await prisma.user.findUnique({
      where: { id: trip.userId },
    });

    // If the user does not exist, create a new user

    if (!userExists) {
      const clerkUser = await currentUser();
      await prisma.user.create({
        data: {
          id: trip.userId,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          email: clerkUser.emailAddresses[0].emailAddress,

          // You need to provide additional required fields for the User model here
        },
      });
    }

    // Create the trip
    const newTrip = await prisma.trip.create({ data: trip });

    return newTrip;
  };

  return (
    <div className="relative h-[70vh] flex items-center justify-center text-white">
      {/* Background image */}
      <Image
        src="/paul-weaver-hero.jpg" // Replace with the path to your image
        layout="fill"
        objectFit="cover"
        quality={100}
        alt="Background"
        className="absolute z-0" // Ensures the image is in the background
      />
      {/* Overlay */}
      <div className="absolute bg-black bg-opacity-50 inset-0 z-10" />
      {/* Text */}
      <div className="relative translate-y-[-130%] z-20 lg:w-[55vw] md:w-[70vw]  w-full">
        <SearchContainer createTrip={createTrip} />
      </div>
    </div>
  );
}
