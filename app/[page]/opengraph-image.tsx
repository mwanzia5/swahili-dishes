import OpengraphImage from "components/opengraph-image";

export default async function Image({ params }: { params: { page: string } }) {
  const title = params.page.charAt(0).toUpperCase() + params.page.slice(1);
  return await OpengraphImage({ title });
}
