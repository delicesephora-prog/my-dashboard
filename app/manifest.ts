import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My Dashboard",
    short_name: "Dashboard",
    description: "A glanceable personal dashboard for work and life.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAFAF9",
    theme_color: "#FAFAF9",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
