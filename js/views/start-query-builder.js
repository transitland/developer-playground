var DeveloperPlayground = DeveloperPlayground || {};

DeveloperPlayground.StartQueryBuilderView = Backbone.View.extend({
    el: "#developer-playground",

    template: _.template($('#playground-template').html()),


    events: {
        'change .form-control#entity': 'changeParam',
        'change .form-control#parameter': 'changeFilter',
        'change .form-control#region': 'changeRegion',
        'click .btn#san-francisco': 'changeMapSF',
        'click .btn#new-york': 'changeMapNY',
        'click .btn#run-query-btn' : 'submit',
    },

    initialize: function () {
        this.operators = new DeveloperPlayground.Operators();
        this.stops = new DeveloperPlayground.Stops();
        this.routes = new DeveloperPlayground.Routes();
        this.render();
    },

    render: function() {
        this.$el.html(this.template());
        $("#nameMenu").hide();
        $("#regionMenu").hide();
        $("#region-line").hide();


        if($("#nameMenu").hasClass("dropdown")) $("#nameMenu").removeClass("dropdown");
        if($("#regionMenu").hasClass("dropdown")) $("#regionMenu").removeClass("dropdown");
        this.mapview = new DeveloperPlayground.MapView();
        this.mapview.render();
        this.downloadview = new DeveloperPlayground.DownloadView();
        this.downloadview.render();
        return this;
    },

    changeParam: function() {

        $("#nameMenu").hide();
        $("#regionMenu").hide();
        $("#region-line").hide();

        if($("#nameMenu").hasClass("dropdown")) $("#nameMenu").removeClass("dropdown");
        if($("#regionMenu").hasClass("dropdown")) $("#regionMenu").removeClass("dropdown");

        var $entitySelect = $('select.form-control#entity');
        var $parameterSelect = $('select.form-control#parameter');
        var selectValues = {
            "base": {
                " ": "",
            },
            "stops": {
                " ": "",
                "map view": "",
                "operator": "",
            },
            "operators": {
                " ": "",
                "map view": "",
                "name": "",
                // "mode": "",
            },
            "routes": {
                " ": "",
                "map view": "",
                "operator": "",
                // "route number": "",
            }
        };

        $parameterSelect.empty().append(function() {
            var output = '';
            $.each(selectValues[$entitySelect.val()], function(key, value) {
                output += '<option>' + key + '</option>';
            });
            return output;
        });

        return this;
    },
    
    changeFilter: function() {
        var $parameterSelect = $('select.form-control#parameter');

        // If the filter (name/mapview) is changed to name/operator, show the region line/menu

        if($parameterSelect.val() == "name" || $parameterSelect.val() == "operator") {
            collection = this.operators;
            $("#regionMenu").show();
            $("#region-line").show();

            if(!$("#regionMenu").hasClass("dropdown")) $("#regionMenu").addClass("dropdown");
            if ('undefined' !== typeof this.regionListView) {
                this.regionListView.close();
                this.regionListView = new DeveloperPlayground.RegionListView({collection: collection});
            } else {
                this.regionListView = new DeveloperPlayground.RegionListView({collection: collection});
            }
            this.operators.setQueryParameters({
                    url: API_HOST+'/api/v1/operators.json?per_page=5000'
                });
            collection.fetch();
            return this;

        } else {
            // if the filter is changed to mapview, hide the region line/menue and the name menu (if shown)
            $("#region-line").hide();
            $("#regionMenu").hide();
            $("#nameMenu").hide();

            if($("#regionMenu").hasClass("dropdown")) $("#regionMenu").removeClass("dropdown");
            if($("#nameMenu").hasClass("dropdown")) $("#nameMenu").removeClass("dropdown");

        }
    },

    // NEW CODE HERE //
    changeRegion: function() {
        var $regionSelect = $('select.form-control#region');

        if ($regionSelect.val() !== 'undefined') {
            collection = this.operators;
            $("#nameMenu").show();
            
            if(!$("#nameMenu").hasClass("dropdown")) $("#nameMenu").addClass("dropdown");
            if ('undefined' !== typeof this.nameListView) {
                this.nameListView.close();
                this.nameListView = new DeveloperPlayground.NameListView({collection: collection});
            } else {
                this.nameListView = new DeveloperPlayground.NameListView({collection: collection});
            }
            this.operators.setQueryParameters({
                    url: API_HOST+'/api/v1/operators.json?per_page=5000'
                });
            collection.fetch();
            return this;

        } else {
            $("#nameMenu").hide();

            if($("#nameMenu").hasClass("dropdown")) $("#nameMenu").removeClass("dropdown");

        }
    },
    // END NEW CODE HERE //

    submit: function() {
        var $entitySelect = $('select.form-control#entity');
        var $parameterSelect = $('select.form-control#parameter');
        var $nameSelect = $('select.form-control#name');
        var bounds = this.mapview.getBounds();
        var identifier = $nameSelect.val();

        var shouldFetchAndResetCollection = true;

        // FOR STOP QUERIES

        if ($entitySelect.val() == "stops") {
            // for search by map view
            if($parameterSelect.val() == "map view") {
            collection = this.stops;
            this.stops.setQueryParameters({
                    url: API_HOST+'/api/v1/'+$entitySelect.val()+'.json?bbox='+bounds+'&per_page=5000'
                });
            // for search by operator name
            } else if($parameterSelect.val() == "operator") {
                collection = this.stops;
                this.stops.setQueryParameters({
                    url: API_HOST+'/api/v1/'+$entitySelect.val()+'.json?servedBy='+identifier+'&per_page=5000',
                });
            }
        
        // FOR OPERATOR QUERIES
        
        } else if ($entitySelect.val() == "operators") {
            
            if($parameterSelect.val() == "map view") {
                collection = this.operators;
                this.operators.setQueryParameters({
                    url: API_HOST+'/api/v1/'+$entitySelect.val()+'.json?bbox='+bounds+'&per_page=5000'
                });
            } else if($parameterSelect.val() == "name") {
                this.operators.hideAll();
                this.operators.get(identifier).set({ display: true });
                shouldFetchAndResetCollection = false;
            } else {
                alert("Please select either map view or name.");
            }
            
        //  FOR ROUTE QUERIES
        
        } else if ($entitySelect.val() == "routes") {
            if($parameterSelect.val() == "map view") {
                collection = this.routes;
                this.routes.setQueryParameters({
                    url: API_HOST+'/api/v1/'+$entitySelect.val()+'.json?bbox='+bounds+'&per_page=5000'
                });
            } else if($parameterSelect.val() == "operator") {
                collection = this.routes;
                this.routes.setQueryParameters({
                    url: API_HOST+'/api/v1/'+$entitySelect.val()+'.json?operatedBy='+identifier+'&per_page=5000',
                });
            } else if($parameterSelect.val() == "route number") {
                collection = this.routes;
                alert("routes by route number not yet functional");
            }
        } else {
            alert("Please select a parameter.");
        }

        if (shouldFetchAndResetCollection) {
            collection.reset();
        }

        $("#download-bar").show();
        this.mapview.markerclustergroup.clearLayers();
        this.mapview.clearCollection();
        this.mapview.setCollection({collection: collection});
        this.mapview.initialize({collection: collection});
        this.downloadview.setCollection({collection: collection});


        if ('undefined' !== typeof this.gridview) this.gridview.close();
        this.gridview = new DeveloperPlayground.GridView({collection: collection});

        if (shouldFetchAndResetCollection) {
            collection.fetch();
        }

        // analytics event tracker:
        if ($parameterSelect.val() == "name" || $parameterSelect.val() == "operator"){
            ga('send', 'event', 'run query', 'click', $entitySelect.val()+' by '+$parameterSelect.val()+', '+$nameSelect.val());
        } else {
            ga('send', 'event', 'run query', 'click', $entitySelect.val()+' by '+$parameterSelect.val());
        }
    },
});