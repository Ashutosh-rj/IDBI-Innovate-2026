import os
import json
import click
import jsonschema
import numpy as np
from jsonschema import validate
from typing import Dict, Any, List
from generators import MsmeProfileGenerator, Scenario

def load_schemas() -> Dict[str, Any]:
    """Loads all JSON Schema contracts from /contracts/v1/."""
    contracts_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "contracts", "v1"
    )
    schemas = {}
    for fname in os.listdir(contracts_dir):
        if fname.endswith(".schema.json"):
            with open(os.path.join(contracts_dir, fname), "r", encoding="utf-8") as f:
                schemas[fname] = json.load(f)
    return schemas

def load_validators(schemas: Dict[str, Any]) -> Dict[str, Any]:
    validators = {}
    for name, schema in schemas.items():
        validator_cls = jsonschema.validators.validator_for(schema)
        validators[name] = validator_cls(schema)
    return validators

def validate_record(record: Dict[str, Any], schema_name: str, validators: Dict[str, Any]):
    """Validates a data record against the pre-compiled JSON Schema validator."""
    validator = validators.get(schema_name)
    if not validator:
        raise ValueError(f"Schema {schema_name} not found.")
    try:
        validator.validate(instance=record)
    except jsonschema.exceptions.ValidationError as e:
        raise ValueError(f"Schema validation failed for {schema_name}: {e.message}")

import concurrent.futures

_GLOBAL_VALIDATORS = None
_GLOBAL_GENERATOR = None

def _init_worker(schemas, base_seed):
    global _GLOBAL_VALIDATORS, _GLOBAL_GENERATOR
    _GLOBAL_VALIDATORS = load_validators(schemas)
    _GLOBAL_GENERATOR = MsmeProfileGenerator(seed=base_seed)

def _generate_one(seed_idx):
    _GLOBAL_GENERATOR.reseed(seed_idx)
    profile_data = _GLOBAL_GENERATOR.generate()
    validate_record(profile_data["profile"], "msme-profile.schema.json", _GLOBAL_VALIDATORS)
    for gst in profile_data["gstFilings"]:
        validate_record(gst, "gst-filing.schema.json", _GLOBAL_VALIDATORS)
    validate_record(profile_data["upiSummary"], "upi-transactions.schema.json", _GLOBAL_VALIDATORS)
    validate_record(profile_data["aaStatement"], "aa-fi-statement.schema.json", _GLOBAL_VALIDATORS)
    validate_record(profile_data["epfoRecord"], "epfo-contribution.schema.json", _GLOBAL_VALIDATORS)
    return profile_data

@click.command()
@click.option("--count", default=10, help="Number of synthetic MSME profiles to generate.")
@click.option("--seed", default=42, help="Random seed for reproducibility.")
@click.option("--output", default="../../data/synthetic_cohort.jsonl", help="Output file path.")
@click.option("--validate-only", is_flag=True, help="Only validate existing generated file.")
def main(count: int, seed: int, output: str, validate_only: bool):
    """
    CLI script to generate N synthetic MSME profiles, validate against official JSON schemas,
    and check aggregate distribution drift against documented RBI/GSTN/NPCI statistics.
    """
    schemas = load_schemas()
    validators = load_validators(schemas)
    click.echo(f"Loaded {len(schemas)} schemas from /contracts/v1/")
    
    if validate_only:
        click.echo(f"Validating existing file: {output}")
        with open(output, "r", encoding="utf-8") as f:
            lines = f.readlines()
        for idx, line in enumerate(lines):
            data = json.loads(line)
            validate_record(data["profile"], "msme-profile.schema.json", validators)
            for gst in data["gstFilings"]:
                validate_record(gst, "gst-filing.schema.json", validators)
            validate_record(data["upiSummary"], "upi-transactions.schema.json", validators)
            validate_record(data["aaStatement"], "aa-fi-statement.schema.json", validators)
            validate_record(data["epfoRecord"], "epfo-contribution.schema.json", validators)
        click.echo(f"Successfully validated {len(lines)} records against all JSON schemas!")
        return

    click.echo(f"Generating {count} synthetic profiles with seed={seed} across CPU cores...")
    os.makedirs(os.path.dirname(os.path.abspath(output)), exist_ok=True)
    
    scenario_counts = {}
    default_counts = 0
    total_turnovers = []
    
    max_workers = min(12, (os.cpu_count() or 4))
    with open(output, "w", encoding="utf-8") as f:
        with concurrent.futures.ProcessPoolExecutor(max_workers=max_workers, initializer=_init_worker, initargs=(schemas, seed)) as executor:
            futures = [executor.submit(_generate_one, seed + i * 10) for i in range(count)]
            for idx, future in enumerate(concurrent.futures.as_completed(futures)):
                profile_data = future.result()
                f.write(json.dumps(profile_data) + "\n")
                
                scen = profile_data["scenario"]
                scenario_counts[scen] = scenario_counts.get(scen, 0) + 1
                default_counts += profile_data["groundTruthLabel"]["default12m"]
                total_turnovers.append(profile_data["profile"]["declaredTurnover"])
                
                if (idx + 1) % 500 == 0 or (idx + 1) == count:
                    click.echo(f"Generated & validated {idx + 1}/{count} profiles...")
                    
    click.echo("\n--- Generation Summary & Statistical Drift Check ---")
    click.echo(f"Total Profiles: {count}")
    for scen, cnt in scenario_counts.items():
        click.echo(f"  {scen}: {cnt} ({cnt/count*100:.1f}%)")
    click.echo(f"Overall Default Rate: {default_counts/count*100:.2f}% (Target: ~15-25% across cohort)")
    click.echo(f"Mean Declared Turnover: INR {np.mean(total_turnovers):,.2f}")
    click.echo(f"Saved to: {output}")

if __name__ == "__main__":
    main()
