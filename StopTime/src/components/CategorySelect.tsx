import React from "react";
import { CategorySpec } from "./actions";
import i18n from "../i18n";

/**
 * Shown once, after the instructions. Every trial in the session is then drawn
 * from the chosen category.
 *
 * Category names come straight out of actions.json, so they are not run
 * through i18n — only the heading around them is.
 */
export const CategorySelect: React.FC<{
  categories: CategorySpec[];
  onSelect(category: CategorySpec): void;
}> = ({ categories, onSelect }) => (
  <div className="st-area st-area-center">
    <div className="st-category-card">
      <h2 className="st-category-title">{i18n.t("CHOOSE_CATEGORY")}</h2>
      <div className="st-category-list">
        {categories.map((c) => (
          <button
            key={c.category}
            type="button"
            className="st-category-btn"
            onClick={() => onSelect(c)}
          >
            {c.category}
          </button>
        ))}
      </div>
    </div>
  </div>
);
