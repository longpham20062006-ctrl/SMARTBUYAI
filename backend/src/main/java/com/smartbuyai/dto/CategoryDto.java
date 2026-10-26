package com.smartbuyai.dto;

public class CategoryDto {
    private String id;
    private String name;
    private String slug;
    private String gender;
    private String parentCategory;
    private String description;
    private Integer displayOrder;

    public CategoryDto() {}

    public CategoryDto(String id, String name, String slug, String gender, String parentCategory, String description, Integer displayOrder) {
        this.id = id;
        this.name = name;
        this.slug = slug;
        this.gender = gender;
        this.parentCategory = parentCategory;
        this.description = description;
        this.displayOrder = displayOrder;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getParentCategory() { return parentCategory; }
    public void setParentCategory(String parentCategory) { this.parentCategory = parentCategory; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(Integer displayOrder) { this.displayOrder = displayOrder; }
}
