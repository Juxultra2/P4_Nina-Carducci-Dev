(function($) {
  // Création d'un plugin jQuery appelé mauGallery
  $.fn.mauGallery = function(options) {
    // Fusionner les options fournies par l'utilisateur avec les options par défaut
    var options = $.extend($.fn.mauGallery.defaults, options);
    var tagsCollection = []; // Collection pour stocker les tags de la galerie
    // Parcourir chaque élément sur lequel le plugin est appliqué
    return this.each(function() {
      // Créer un conteneur pour les lignes de la galerie
      $.fn.mauGallery.methods.createRowWrapper($(this));
      // Si l'option lightBox est activée, créer une lightbox pour les images
      if (options.lightBox) {
        // Initialiser les listeners (événements) pour l'interaction
        $.fn.mauGallery.methods.createLightBox(
          // Parcourir chaque élément avec la classe "gallery-item"
          $(this),
          options.lightboxId,
          options.navigation
        );
      }
      $.fn.mauGallery.listeners(options);

      $(this)
        .children(".gallery-item")
        .each(function(index) {
          // Adapter chaque image pour qu'elle soit réactive
          $.fn.mauGallery.methods.responsiveImageItem($(this));
          // Déplacer l'élément dans le conteneur de lignes
          $.fn.mauGallery.methods.moveItemInRowWrapper($(this));
          // Encapsuler l'élément dans une colonne en fonction du nombre de colonnes définies
          $.fn.mauGallery.methods.wrapItemInColumn($(this), options.columns);
          // Vérifier si l'élément a un tag associé et ajouter à la collection de tags
          var theTag = $(this).data("gallery-tag");
          if (
            options.showTags &&
            theTag !== undefined &&
            tagsCollection.indexOf(theTag) === -1
          ) {
            tagsCollection.push(theTag);
          }
        });

      // Si l'option showTags est activée, afficher les tags au-dessus ou en dessous de la galerie
      if (options.showTags) {
        $.fn.mauGallery.methods.showItemTags(
          $(this),
          options.tagsPosition,
          tagsCollection
        );
      }

      // Faire apparaître la galerie progressivement
      $(this).fadeIn(500);
    });
  };

  // Définir les options par défaut pour le plugin
  $.fn.mauGallery.defaults = {
    columns: 3, // Nombre de colonnes dans la galerie
    lightBox: true, // Activer/désactiver la lightbox
    lightboxId: null, // ID de la lightbox, null par défaut
    showTags: true, // Afficher ou non les tags
    tagsPosition: "bottom", // Position des tags (en bas par défaut)
    navigation: true // Activer/désactiver la navigation dans la lightbox
  };

  // Définition des listeners pour les interactions
  $.fn.mauGallery.listeners = function(options) {
    // Quand on clique sur un élément de galerie (une image), ouvrir la lightbox si activée
    $(".gallery-item").on("click", function() {
      if (options.lightBox && $(this).prop("tagName") === "IMG") {
        $.fn.mauGallery.methods.openLightBox($(this), options.lightboxId);
      } else {
        return;
      }
    });

    // Filtrer les images par tag lors d'un clic sur un tag
    $(".gallery").on("click", ".nav-link", $.fn.mauGallery.methods.filterByTag);
    // Navigation dans la lightbox (image précédente)
    $(".gallery").on("click", ".mg-prev", () =>
      $.fn.mauGallery.methods.prevImage(options.lightboxId)
    );
    // Navigation dans la lightbox (image suivante)
    $(".gallery").on("click", ".mg-next", () =>
      $.fn.mauGallery.methods.nextImage(options.lightboxId)
    );
  };

  // Méthodes utilisées par le plugin mauGallery
  $.fn.mauGallery.methods = {
    // Créer un conteneur pour les lignes dans la galerie
    createRowWrapper(element) {
      if (
        !element
          .children()
          .first()
          .hasClass("row")
      ) {
        element.append('<div class="gallery-items-row row"></div>');
      }
    },

    // Encapsuler chaque élément de la galerie dans une colonne
    wrapItemInColumn(element, columns) {
      if (columns.constructor === Number) {
        element.wrap(
          `<div class='item-column mb-4 col-${Math.ceil(12 / columns)}'></div>`
        );
      } else if (columns.constructor === Object) {
        // Si un objet est fourni, on adapte la taille des colonnes pour différentes tailles d'écran (XS, SM, MD, LG, XL)
        var columnClasses = "";
        if (columns.xs) {
          columnClasses += ` col-${Math.ceil(12 / columns.xs)}`;
        }
        if (columns.sm) {
          columnClasses += ` col-sm-${Math.ceil(12 / columns.sm)}`;
        }
        if (columns.md) {
          columnClasses += ` col-md-${Math.ceil(12 / columns.md)}`;
        }
        if (columns.lg) {
          columnClasses += ` col-lg-${Math.ceil(12 / columns.lg)}`;
        }
        if (columns.xl) {
          columnClasses += ` col-xl-${Math.ceil(12 / columns.xl)}`;
        }
        element.wrap(`<div class='item-column mb-4${columnClasses}'></div>`);
      } else {
        console.error(
          `Columns should be defined as numbers or objects. ${typeof columns} is not supported.`
        );
      }
    },
    // Déplacer l'élément dans la rangée de la galerie
    moveItemInRowWrapper(element) {
      element.appendTo(".gallery-items-row");
    },
    // Rendre l'image réactive (adaptation à l'écran)
    responsiveImageItem(element) {
      if (element.prop("tagName") === "IMG") {
        element.addClass("img-fluid");
      }
    },
    // Ouvrir la lightbox avec l'image sélectionnée
    openLightBox(element, lightboxId) {
      $(`#${lightboxId}`)
        .find(".lightboxImage")
        .attr("src", element.attr("src"));
      $(`#${lightboxId}`).modal("toggle");
    },
    // Naviguer vers l'image précédente dans la lightbox
    prevImage() {
      let activeImage = null;
      $("img.gallery-item").each(function() {
        if ($(this).attr("src") === $(".lightboxImage").attr("src")) {
          activeImage = $(this);
        }
      });
      // Trouver toutes les images correspondant au tag actif
      let activeTag = $(".tags-bar span.active-tag").data("images-toggle");
      let imagesCollection = [];
      if (activeTag === "all") {
        $(".item-column").each(function() {
          if ($(this).children("img").length) {
            imagesCollection.push($(this).children("img"));
          }
        });
      } else {
        $(".item-column").each(function() {
          if (
            $(this)
              .children("img")
              .data("gallery-tag") === activeTag
          ) {
            imagesCollection.push($(this).children("img"));
          }
        });
      }
      // Trouver l'image précédente dans la collection
      let index = 0,
        next = null;

      $(imagesCollection).each(function(i) {
        if ($(activeImage).attr("src") === $(this).attr("src")) {
          index = i ;
        }
      });
      next = imagesCollection[index - 1] || imagesCollection[imagesCollection.length - 1];
      $(".lightboxImage").attr("src", $(next).attr("src"));
    },
    // Naviguer vers l'image suivante dans la lightbox
    nextImage() {
      let activeImage = null;
      $("img.gallery-item").each(function() {
        if ($(this).attr("src") === $(".lightboxImage").attr("src")) {
          activeImage = $(this);
        }
      });
      let activeTag = $(".tags-bar span.active-tag").data("images-toggle");
      let imagesCollection = [];
      if (activeTag === "all") {
        $(".item-column").each(function() {
          if ($(this).children("img").length) {
            imagesCollection.push($(this).children("img"));
          }
        });
      } else {
        $(".item-column").each(function() {
          if (
            $(this)
              .children("img")
              .data("gallery-tag") === activeTag
          ) {
            imagesCollection.push($(this).children("img"));
          }
        });
      }
      let index = 0,
        next = null;

      $(imagesCollection).each(function(i) {
        if ($(activeImage).attr("src") === $(this).attr("src")) {
          index = i;
        }
      });
      next = imagesCollection[index + 1] || imagesCollection[0];
      $(".lightboxImage").attr("src", $(next).attr("src"));
    },
    // Créer la lightbox pour afficher les images en grand format
    createLightBox(gallery, lightboxId, navigation) {
      gallery.append(`<div class="modal fade" id="${
        lightboxId ? lightboxId : "galleryLightbox"
      }" tabindex="-1" role="dialog" aria-hidden="true">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-body">
                            ${
                              navigation
                                ? '<div class="mg-prev" style="cursor:pointer;position:absolute;top:50%;left:-15px;background:white;"><</div>'
                                : '<span style="display:none;" />'
                            }
                            <img class="lightboxImage img-fluid" alt="Contenu de l'image affichée dans la modale au clique"/>
                            ${
                              navigation
                                ? '<div class="mg-next" style="cursor:pointer;position:absolute;top:50%;right:-15px;background:white;}">></div>'
                                : '<span style="display:none;" />'
                            }
                        </div>
                    </div>
                </div>
            </div>`);
    },
    // Afficher les tags pour filtrer les images
    showItemTags(gallery, position, tags) {
      var tagItems =
        '<li class="nav-item"><span class="nav-link active active-tag"  data-images-toggle="all">Tous</span></li>';
      $.each(tags, function(index, value) {
        tagItems += `<li class="nav-item active">
                <span class="nav-link"  data-images-toggle="${value}">${value}</span></li>`;
      });
      var tagsRow = `<ul class="my-4 tags-bar nav nav-pills">${tagItems}</ul>`;

      if (position === "bottom") {
        gallery.append(tagsRow);
      } else if (position === "top") {
        gallery.prepend(tagsRow);
      } else {
        console.error(`Unknown tags position: ${position}`);
      }
    },

    // Filtrer les images par tag lorsqu'on clique sur un tag
    filterByTag() {
      if ($(this).hasClass("active-tag")) {
        return;
      }
      $(".active-tag").removeClass("active active-tag");
      $(this).addClass("active-tag");

      var tag = $(this).data("images-toggle");

      // Filtrer les éléments de la galerie en fonction du tag sélectionné
      $(".gallery-item").each(function() {
        $(this)
          .parents(".item-column")
          .hide();
        if (tag === "all") {
          $(this)
            .parents(".item-column")
            .show(300);
        } else if ($(this).data("gallery-tag") === tag) {
          $(this)
            .parents(".item-column")
            .show(300);
        }
      });
    }
  };
})(jQuery);
