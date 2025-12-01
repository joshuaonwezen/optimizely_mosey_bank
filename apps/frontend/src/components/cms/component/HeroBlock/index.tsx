//import { useMemo } from 'react'
import Image from "next/image";
import {
  CmsEditable,
  type CmsComponent,
  RichText,
} from "@remkoj/optimizely-cms-react/rsc";
import {
  HeroBlockDataFragmentDoc,
  ButtonBlockPropertyDataFragmentDoc,
  ReferenceDataFragmentDoc,
  LinkDataFragmentDoc,
  type HeroBlockDataFragment,
} from "@/gql/graphql";
import { getFragmentData } from "@gql/fragment-masking";
import ButtonBlock from "../ButtonBlock";

import {
  createBatchEventProcessor,
  createInstance,
  createPollingProjectConfigManager,
} from "@optimizely/optimizely-sdk";

const ColorClasses = {
  "dark-blue": "on-vulcan",
  blue: "on-azure",
  orange: "on-tangy",
  green: "on-verdansk",
  red: "on-paleruby",
  purple: "on-people-eater",
};

/**
 * Hero
 * Hero
 */
export const HeroBlockComponent: CmsComponent<HeroBlockDataFragment> = ({
  data: {
    heroImage: image,
    eyebrow = "",
    heroHeading: heading = "",
    heroDescription: description = { html: "", json: "{}" },
    heroColor: color = "blue",
    heroButton = null,
  },
  inEditMode,
  contentLink,
}) => {
  const SDK_KEY="XfB8W9nDrbKSw77GpAuuY";
  const pollingConfigManager = createPollingProjectConfigManager({
    sdkKey: SDK_KEY,
  });
  const batchEventProcessor = createBatchEventProcessor();
  const optimizelyClient = createInstance({
    projectConfigManager: pollingConfigManager,
    eventProcessor: batchEventProcessor,
  });

  const attributes = { logged_in: true };
  const user = optimizelyClient.createUserContext('user123', attributes);



  const heroImage = getFragmentData(ReferenceDataFragmentDoc, image);
  const heroImageLink = getFragmentData(LinkDataFragmentDoc, heroImage?.url);
  const heroImageSrc = new URL(
    heroImageLink?.default ?? "/",
    heroImageLink?.base ?? "https://example.com",
  ).href;
  const button = getFragmentData(
    ButtonBlockPropertyDataFragmentDoc,
    heroButton,
  );
  const hasImage = heroImageLink != null && heroImageLink != undefined;

  const decision = user.decide('banner');
  console.log('Hero Banner Decision:', decision);
  
  // Feature experiment demo - different hero styles based on banner flag
  const getHeroVariant = () => {
    if (!decision?.enabled) return 'default';
    
    const variationKey = decision.variationKey;
    console.log('Banner variation:', variationKey, decision?.enabled);
    
    switch (variationKey) {
      case 'treatment':
        return 'gradient';
      case 'control':
        return 'shadow';
      default:
        return 'default';
    }
  };
  
  const heroVariant = getHeroVariant();
  
  // Dynamic styling based on experiment variation
  const getHeroClasses = () => {
    const baseClasses = `py-8 lg:py-16 ${ColorClasses[color || "blue"]}`;
    
    switch (heroVariant) {
      case 'gradient':
        return `${baseClasses} bg-gradient-to-r from-blue-600 to-purple-600`;
      case 'shadow':
        return `${baseClasses} shadow-2xl border border-gray-200`;
      default:
        return baseClasses;
    }
  };
  
  return (
    <CmsEditable
      as="section"
      className={getHeroClasses()}
      cmsId={contentLink.key}
    >
      <div className={`w-full @container/card container px-8 mx-auto`}>
        <div
          className={`w-full h-full grid items-center grid-cols-1 ${
            hasImage
              ? "gap-8 @[40rem]/card:grid-cols-2 @[80rem]/card:gap-16"
              : ""
          }`}
        >
          <div
            className={`prose lg:prose-h1:text-7xl lg:prose-h1:my-12 prose-h1:font-bold prose-p:text-2xl prose-p:leading-10 prose-img:my-4 ${hasImage ? "" : "max-w-[900px] mx-auto"}`}
          >
            {/* Feature Experiment Indicator */}
            {decision.enabled && (
              <div className="mb-4 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full inline-block">
                🧪 Experiment Active: {heroVariant} variant ({decision.variationKey})
              </div>
            )}
            
            {(inEditMode || eyebrow) && (
              <CmsEditable as="p" cmsFieldName="Eyebrow" className="eyebrow">
                {eyebrow || "+ Add Eyebrow"}
              </CmsEditable>
            )}
            {(inEditMode || heading) && (
              <CmsEditable as="h1" cmsFieldName="Heading">
                {heading || "+ Add Heading"}
              </CmsEditable>
            )}
            {description?.json ? (
              <CmsEditable
                as={RichText}
                text={description.json}
                cmsFieldName="Description"
              />
            ) : (
              inEditMode &&
              !description?.json && (
                <div data-epi-edit={inEditMode ? "Description" : undefined}>
                  + Add Description
                </div>
              )
            )}
            {button && button.children ? (
              <CmsEditable
                as={ButtonBlock}
                cmsFieldName="HeroButton"
                data={button}
                inEditMode={false}
                contentLink={{ key: null }}
              />
            ) : (
              inEditMode &&
              !(button && button.children) && (
                <div className="mt-8 flex justify-end">
                  <ButtonBlock
                    buttonType={"secondary"}
                    buttonVariant={"cta"}
                    data-epi-edit={inEditMode ? "HeroButton" : undefined}
                  >
                    + Add Button
                  </ButtonBlock>
                </div>
              )
            )}
          </div>
          {hasImage ? (
            <div className={`order-first @[40rem]/card:order-last`}>
              <Image
                data-epi-edit={inEditMode ? "HeroImage" : undefined}
                className="rounded-[2rem] w-full"
                src={heroImageSrc}
                alt={""}
                width={600}
                height={500}
              />
            </div>
          ) : inEditMode && !hasImage ? (
            <div className="mt-8 flex justify-end">
              <ButtonBlock
                buttonType={"primary"}
                buttonVariant={"cta"}
                data-epi-edit={inEditMode ? "HeroImage" : undefined}
              >
                + Add Image
              </ButtonBlock>
            </div>
          ) : null}
        </div>
      </div>
    </CmsEditable>
  );
};
HeroBlockComponent.displayName = "Hero (Component/HeroBlock)";
HeroBlockComponent.getDataFragment = () => [
  "HeroBlockData",
  HeroBlockDataFragmentDoc,
];

export default HeroBlockComponent;
