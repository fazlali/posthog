from typing import Dict, Type

from rest_framework import authentication, mixins, serializers, viewsets

from posthog.api.forbid_destroy_model import ForbidDestroyModel
from posthog.api.routing import StructuredViewSetMixin
from posthog.auth import PersonalAPIKeyAuthentication
from posthog.models import DashboardTemplate, Team
from posthog.utils import str_to_bool


class DashboardTemplateBasicSerializer(serializers.Serializer):
    id: serializers.UUIDField = serializers.UUIDField(read_only=True)
    template_name: serializers.CharField = serializers.CharField(max_length=400, required=False)
    deleted: serializers.BooleanField = serializers.BooleanField(write_only=True, default=False, required=False)

    def validate(self, data: Dict) -> Dict:
        if "template_name" in data:
            template_name = data.get("template_name", None)
            if not template_name or not isinstance(template_name, str) or str.isspace(template_name):
                raise serializers.ValidationError("Must provide a template name")

        if "deleted" in data:
            deleted = data.get("deleted", None)
            if not isinstance(str_to_bool(deleted), bool):
                raise serializers.ValidationError("Must provide a valid deleted value")

        return data

    def update(self, instance: DashboardTemplate, validated_data: dict) -> DashboardTemplate:
        updated_fields = []

        if "template_name" in validated_data:
            instance.template_name = validated_data["template_name"]
            updated_fields.append("template_name")

        if "deleted" in validated_data:
            instance.deleted = validated_data["deleted"]
            updated_fields.append("deleted")

        if updated_fields:
            instance.save(update_fields=updated_fields)

        return instance


class DashboardTemplateSerializer(serializers.Serializer):
    id: serializers.UUIDField = serializers.UUIDField(read_only=True)
    template_name: serializers.CharField = serializers.CharField(max_length=400)
    source_dashboard: serializers.IntegerField = serializers.IntegerField(allow_null=True)
    dashboard_description: serializers.CharField = serializers.CharField(max_length=400, allow_blank=True)
    dashboard_filters: serializers.JSONField = serializers.JSONField(allow_null=True, required=False)
    tiles: serializers.JSONField = serializers.JSONField(default=dict)
    tags: serializers.ListField = serializers.ListField(child=serializers.CharField(), allow_null=True)

    def validate(self, data: Dict) -> Dict:
        template_name = data.get("template_name", None)
        if not template_name or not isinstance(template_name, str) or str.isspace(template_name):
            raise serializers.ValidationError("Must provide a template name")

        if not data.get("source_dashboard"):
            raise serializers.ValidationError("Must provide the id of the source dashboard")

        if not data.get("tiles") or not isinstance(data["tiles"], list):
            raise serializers.ValidationError("Must provide at least one tile")

        for tile in data["tiles"]:
            if "layouts" not in tile or not isinstance(tile["layouts"], dict):
                raise serializers.ValidationError("Must provide a tile layouts")

            if not tile.get("type"):
                raise serializers.ValidationError("Must provide a tile type")

            if tile.get("type") == "INSIGHT":
                if not tile.get("filters"):
                    raise serializers.ValidationError("Must provide insight filters")
                if not tile.get("name"):
                    raise serializers.ValidationError("Must provide insight name")
            elif tile.get("type") == "TEXT":
                if not tile.get("body"):
                    raise serializers.ValidationError("Must provide text body")
            else:
                raise serializers.ValidationError("Must provide a valid tile type")

        return data

    def create(self, validated_data: Dict) -> DashboardTemplate:
        team = Team.objects.get(id=self.context["team_id"])
        return DashboardTemplate.objects.create(**validated_data, team=team)


class DashboardTemplatesViewSet(
    StructuredViewSetMixin,
    viewsets.GenericViewSet,
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.UpdateModelMixin,
    ForbidDestroyModel,
):
    queryset = DashboardTemplate.objects.all()
    serializer_class = DashboardTemplateSerializer
    authentication_classes = [
        PersonalAPIKeyAuthentication,
        authentication.SessionAuthentication,
        authentication.BasicAuthentication,
    ]

    def get_serializer_class(self) -> Type[serializers.BaseSerializer]:
        if str_to_bool(self.request.query_params.get("basic", "0")):
            return DashboardTemplateBasicSerializer
        return super().get_serializer_class()

    def get_queryset(self):
        return self.filter_queryset_by_parents_lookups(DashboardTemplate.objects.exclude(deleted=True).all())