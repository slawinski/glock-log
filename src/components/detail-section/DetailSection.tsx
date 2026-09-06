import React from "react";
import { View } from "react-native";

import { SectionHeading } from "../section-heading/SectionHeading";

type Props = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

export const DetailSection = ({ title, children, className = "" }: Props) => (
  <View className={`mb-6 ${className}`}>
    <SectionHeading title={title} />
    {children}
  </View>
);
