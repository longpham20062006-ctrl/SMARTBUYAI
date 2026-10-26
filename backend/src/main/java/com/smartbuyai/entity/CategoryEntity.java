package com.smartbuyai.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "categories")
public class CategoryEntity {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "slug", nullable = false, unique = true)
    private String slug;

    @Column(name = "gender", length = 32)
    private String gender; // 'nam', 'nu', 'unisex', 'all'

    @Column(name = "parent_category", length = 64)
    private String parentCategory;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    public CategoryEntity() {}

    public CategoryEntity(String id, String name, String slug, String gender, String parentCategory, String description) {
        this.id = id;
        this.name = name;
        this.slug = slug;
        this.gender = gender;
        this.parentCategory = parentCategory;
        this.description = description;
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
